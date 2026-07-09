import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { analyzeReply, draftResponse, tipsFor } = require('../src/constants/replyAssistant.js');

const ctx = { contactName: 'Jane', brand: 'GlowLab', product: 'Barrier Serum', buyerName: 'Marie', certs: ['ISO 22716', '비건 인증'] };

test('가격·샘플 의도 감지', () => {
  const a = analyzeReply('Hi, we are interested. Could you share your price list, MOQ and send some samples?');
  const keys = a.intents.map((i) => i.key);
  assert.ok(keys.includes('pricing'));
  assert.ok(keys.includes('samples'));
  assert.ok(keys.includes('interested'));
  assert.equal(a.needsExpert, true); // pricing = 협상 단계
});

test('draft가 감지된 의도를 반영', () => {
  const a = analyzeReply('Please send price and samples.');
  const d = draftResponse(a, ctx);
  assert.ok(/Dear Marie,/.test(d.body));
  assert.ok(/price list/.test(d.body));
  assert.ok(/samples/i.test(d.body));
  assert.ok(/GlowLab/.test(d.body));
  assert.ok(/Re: GlowLab/.test(d.subject));
});

test('compliance 의도 → 인증 언급 + 전문가 팁', () => {
  const a = analyzeReply('Can you provide INCI and CPNP documentation?');
  const d = draftResponse(a, ctx);
  assert.ok(/ISO 22716/.test(d.body));
  assert.ok(/CPNP/.test(d.body));
  const tips = tipsFor(a);
  assert.ok(tips.some((t) => /전문가 확인/.test(t)));
});

test('거절 답장 → 관계 유지 톤, needsExpert 아님', () => {
  const a = analyzeReply('Thank you but unfortunately this is not a fit for us at this time.');
  assert.equal(a.isRejection, true);
  assert.equal(a.needsExpert, false);
  const d = draftResponse(a, ctx);
  assert.ok(/completely understand/.test(d.body));
  assert.ok(/Thank you — GlowLab/.test(d.subject));
});

test('의도 없는 텍스트도 안전하게 기본 draft', () => {
  const a = analyzeReply('Hello.');
  assert.equal(a.intents.length, 0);
  const d = draftResponse(a, ctx);
  assert.ok(d.body.length > 0 && d.subject.length > 0);
});

test('buyerName 없으면 Hello, 로 시작', () => {
  const a = analyzeReply('interested');
  const d = draftResponse(a, { brand: 'GlowLab', contactName: 'Jane' });
  assert.ok(/^Hello,/.test(d.body));
});
