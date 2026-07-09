import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const roadmap = require('../src/services/roadmap.service.js');

// 브로셔 없음 + EU 준비 일부 보유 회원
const diagBrochureless = {
  isSellingInKorea: '판매 중',
  certifications: ['ISO 22716', '비건 인증'],
  euComplianceReadiness: ['CPNP 사전 등록', '제품정보파일(PIF) 구비'],
  packagingReadiness: [],
  productFiles: [],
};

test('16단계 반환, 택일 단계는 하나만', () => {
  const { steps, progress } = roadmap.buildRoadmap(diagBrochureless, {});
  assert.equal(steps.length, 16);
  assert.equal(progress.total, 16);
  const ids = steps.map((s) => s.id);
  // 브로셔 없음 → catalog_generate 노출, catalog_audit 미노출
  assert.ok(ids.includes('catalog_generate'));
  assert.ok(!ids.includes('catalog_audit'));
});

test('진단 데이터로 done 파생', () => {
  const { steps } = roadmap.buildRoadmap(diagBrochureless, {});
  const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
  assert.equal(byId.eu_cpnp.done, true); // euComplianceReadiness에 포함
  assert.equal(byId.eu_pif.done, true);
  assert.equal(byId.eu_rp.done, false); // 미포함
  assert.equal(byId.domestic_proof.done, true); // 판매중 + 실인증
});

test('브로셔 있으면 catalog_audit 택일', () => {
  const { steps } = roadmap.buildRoadmap(
    { ...diagBrochureless, productFiles: [{ fileName: 'a.pdf' }] },
    {}
  );
  const ids = steps.map((s) => s.id);
  assert.ok(ids.includes('catalog_audit'));
  assert.ok(!ids.includes('catalog_generate'));
});

test('회원 진행상태가 파생값을 override', () => {
  const { steps, progress } = roadmap.buildRoadmap(diagBrochureless, {
    eu_rp: { done: true, doneAt: '2026-07-09T00:00:00.000Z' },
  });
  const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
  assert.equal(byId.eu_rp.done, true);
  assert.equal(byId.eu_rp.derivedDone, false); // 파생은 여전히 false
  assert.ok(progress.doneCount >= 4);
});

test('expertRemaining은 미완료 expert/hybrid 수', () => {
  const { steps, progress } = roadmap.buildRoadmap(diagBrochureless, {});
  const manual = steps.filter(
    (s) => (s.tag === 'expert' || s.tag === 'hybrid') && !s.done
  ).length;
  assert.equal(progress.expertRemaining, manual);
  assert.ok(progress.expertRemaining > 0);
});

test('빈 진단도 안전하게 16단계', () => {
  const { steps } = roadmap.buildRoadmap(null, {});
  assert.equal(steps.length, 16);
});

test('isValidStepId', () => {
  assert.equal(roadmap.isValidStepId('eu_cpnp'), true);
  assert.equal(roadmap.isValidStepId('nope'), false);
});
