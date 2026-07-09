import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { generateDiagnosis } = require('../src/services/aiDiagnosis.service.js');

// EU 요건 거의 없음 + 바이어 없음 → 구체 갭이 풍부해야 함
const weak = {
  companyName: '테스트뷰티',
  isSellingInKorea: '판매 중',
  certifications: ['ISO 22716'],
  euComplianceReadiness: ['CPNP 사전 등록'],
  packagingReadiness: [],
  productFiles: [],
  hasExistingBuyer: '없음',
  exportExperience: '없음',
  painPoints: ['영문 회사소개서/카탈로그가 없습니다', '박람회 이후 바이어 Follow-up이 안 됩니다'],
};

test('기존 필드 유지 + 신규 필드 존재', () => {
  const r = generateDiagnosis(weak);
  assert.equal(typeof r.overallScore, 'number');
  assert.ok(r.sections.euRegulationReadiness);
  assert.ok(Array.isArray(r.priorities));
  assert.ok(r.euStatus && typeof r.euStatus.haveCount === 'number');
});

test('EU 상태: 7개 중 1개 보유, 6개 미비', () => {
  const r = generateDiagnosis(weak);
  assert.equal(r.euStatus.total, 7);
  assert.equal(r.euStatus.haveCount, 1);
  assert.equal(r.euStatus.missing.length, 6);
  assert.ok(r.euStatus.missing.includes('EU 책임자(RP) 지정'));
});

test('섹션별 구체 갭', () => {
  const r = generateDiagnosis(weak);
  assert.ok(r.sections.euRegulationReadiness.gaps.length >= 3);
  assert.ok(r.sections.salesMaterialReadiness.gaps.includes('영문 카탈로그·회사소개서'));
  assert.ok(r.sections.buyerFollowUpReadiness.gaps.includes('타겟 바이어 리스트'));
});

test('우선 과제 최대 3개 + label/note', () => {
  const r = generateDiagnosis(weak);
  assert.ok(r.priorities.length >= 1 && r.priorities.length <= 3);
  for (const p of r.priorities) { assert.ok(p.label && p.note); }
  // EU 6개 미비 → 최상단은 EU 필수 요건 묶음
  assert.ok(/EU 필수 요건/.test(r.priorities[0].label));
});

test('요약·훅이 구체 갭을 언급', () => {
  const r = generateDiagnosis(weak);
  assert.ok(/EU 필수 요건 7개 중 6개/.test(r.summary));
  assert.ok(r.consultingNeed.pitch.length > 0);
});

test('EU 요건 다 갖춘 경우 missing 0 + 요약 문구', () => {
  const strong = {
    ...weak,
    euComplianceReadiness: [
      'EU 책임자(Responsible Person) 지정', 'CPNP 사전 등록', '제품정보파일(PIF) 구비',
      '제품안전성보고서(CPSR) 작성', '전성분(INCI) EU 규정 적합성 확인', 'EU 라벨링 요건 충족',
      '향료 알레르겐(80종) 표시 대응',
    ],
    hasExistingBuyer: '있음',
  };
  const r = generateDiagnosis(strong);
  assert.equal(r.euStatus.missing.length, 0);
  assert.ok(/대체로 갖추셨습니다/.test(r.summary));
});
