import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { auditText, DISCLAIMER } = require('../src/constants/catalogAuditRules.js');

test('위험 표현 감지: 미백 + 치료', () => {
  const r = auditText('이 제품은 미백에 좋고 여드름 치료에 효과적입니다.');
  const keys = r.findings.map((f) => f.key);
  assert.ok(keys.includes('whitening'));
  assert.ok(keys.includes('medicinal'));
  assert.equal(r.summary.flaggedCount, r.findings.length);
});

test('영문 whitening/anti-inflammatory 감지', () => {
  const r = auditText('Our whitening cream is anti-inflammatory.');
  const keys = r.findings.map((f) => f.key);
  assert.ok(keys.includes('whitening'));
  assert.ok(keys.includes('medicinal'));
});

test('발견마다 category·why·hint·matched 포함', () => {
  const r = auditText('미백 화이트닝');
  const f = r.findings.find((x) => x.key === 'whitening');
  assert.ok(f.category && f.why && f.hint);
  assert.ok(Array.isArray(f.matched) && f.matched.length >= 1);
});

test('바이어레디: INCI·인증·거래조건·영문', () => {
  const r = auditText('Full INCI list. ISO 22716 certified. MOQ 500, FOB Busan.');
  const map = Object.fromEntries(r.buyerReady.map((b) => [b.item, b.present]));
  assert.equal(map['INCI 전성분'], true);
  assert.equal(map['인증'], true);
  assert.equal(map['거래조건(MOQ·Incoterms)'], true);
  assert.equal(map['영문 자료'], true);
});

test('깨끗한 문구는 flaggedCount 0', () => {
  const r = auditText('가볍게 발리는 데일리 모이스처라이저입니다.');
  assert.equal(r.summary.flaggedCount, 0);
});

test('빈 입력 안전', () => {
  const r = auditText('');
  assert.equal(r.summary.flaggedCount, 0);
  assert.equal(r.summary.checkedChars, 0);
});

test('20000자 상한', () => {
  const r = auditText('가'.repeat(25000));
  assert.equal(r.summary.checkedChars, 20000);
});

test('면책 문구 항상 포함 + 단정 표현 없음', () => {
  const r = auditText('미백');
  assert.equal(r.disclaimer, DISCLAIMER);
  assert.ok(/법률 자문/.test(r.disclaimer));
  // 규칙 텍스트에 단정 표현이 없어야 함
  const blob = JSON.stringify(require('../src/constants/catalogAuditRules.js'));
  assert.ok(!/금지|위반|불법/.test(blob));
});
