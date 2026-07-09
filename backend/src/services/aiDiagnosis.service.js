// ── 자동 진단 (기본/훅용) ──
//
// 제출 즉시 보여주는 "기본 진단 결과"를 규칙 기반으로 산출한다.
// 이 결과는 미끼(lead magnet)이며, 바이어 매칭·계약까지는 전문가 컨설팅으로 유도한다.
// 향후 실제 LLM/규제 DB 매칭 연동 시 generateDiagnosis() 본문만 교체하면 된다.

const diagnosisService = require('./diagnosis.service');

const EU_CORE = [
  'EU 책임자(Responsible Person) 지정',
  'CPNP 사전 등록',
  '제품정보파일(PIF) 구비',
  '제품안전성보고서(CPSR) 작성',
  '전성분(INCI) EU 규정 적합성 확인',
  'EU 라벨링 요건 충족',
  '향료 알레르겐(80종) 표시 대응',
];
const PKG_READY = [
  '재활용 가능 포장재 사용',
  '적합성 선언서(DoC) 구비',
  '기술 문서 구비',
  '재생원료 함량 확인',
];

function clamp(n) {
  return Math.max(5, Math.min(98, Math.round(n)));
}

function generateDiagnosis(request) {
  const certs = request.certifications || [];
  const euItems = request.euComplianceReadiness || [];
  const pkgItems = request.packagingReadiness || [];
  const pains = request.painPoints || [];
  const files = request.productFiles || [];

  const sellingInKorea = ['판매 중', '테스트 판매 중'].includes(request.isSellingInKorea);
  const hasRealCerts = certs.some((c) => !['없음', '잘 모르겠음'].includes(c));
  const hasBuyer = request.hasExistingBuyer === '있음';
  const hasExportExp = request.exportExperience && request.exportExperience !== '없음';

  // 1) 제품 준비도
  const productReadiness = clamp(
    45 + (sellingInKorea ? 25 : 0) + (hasRealCerts ? 18 : 0) + (request.monthlySalesOrBestSeller ? 10 : 0)
  );

  // 2) EU 규제 준비도 — 핵심 요건 보유 수 + 포장(PPWR)
  const euHave = EU_CORE.filter((x) => euItems.includes(x)).length; // 0..7
  const euNone =
    euItems.length === 0 || euItems.includes('아직 준비된 항목 없음') || euItems.includes('잘 모르겠음');
  let euBase = euNone ? 20 : 20 + (euHave / EU_CORE.length) * 70; // 20..90
  const pkgReady = pkgItems.filter((x) => PKG_READY.includes(x)).length;
  const pkgUnaware = pkgItems.includes('PPWR을 처음 들어봄') || pkgItems.includes('아직 준비 안 됨');
  const pkgScore = pkgReady ? 50 + pkgReady * 10 : pkgUnaware ? 20 : 40;
  const euRegulationReadiness = clamp(euBase * 0.8 + pkgScore * 0.2);

  // 3) 영업자료 준비도
  let sales = 62;
  if (pains.includes('영문 회사소개서/카탈로그가 없습니다')) sales -= 22;
  if (files.length) sales += 15;
  const salesMaterialReadiness = clamp(sales);

  // 4) 바이어 Follow-up 준비도
  let follow = 45 + (hasBuyer ? 25 : 0) + (hasExportExp ? 15 : 0);
  if (pains.includes('박람회 이후 바이어 Follow-up이 안 됩니다')) follow -= 15;
  const buyerFollowUpReadiness = clamp(follow);

  const overallScore = Math.round(
    (productReadiness + euRegulationReadiness + salesMaterialReadiness + buyerFollowUpReadiness) / 4
  );
  const readinessLevel = overallScore >= 75 ? '준비됨' : overallScore >= 55 ? '부분 준비됨' : '준비 필요';

  const sections = {
    productReadiness: { score: productReadiness, label: '제품 경쟁력', comment: sellingInKorea ? '국내 판매 실적이 있어 바이어 설득의 근거가 됩니다.' : '국내 판매 실적/인증을 보강하면 신뢰도가 올라갑니다.' },
    euRegulationReadiness: { score: euRegulationReadiness, label: 'EU 규제 준비', comment: euNone ? '책임자(RP)·CPNP·PIF 등 필수 요건 준비가 시급합니다.' : `핵심 요건 ${euHave}/7개 확보. 남은 항목과 PPWR 대응이 필요합니다.` },
    salesMaterialReadiness: { score: salesMaterialReadiness, label: '영업 자료', comment: files.length ? '제품 자료가 있어 카탈로그 제작을 앞당길 수 있습니다.' : '영문 카탈로그·Offer Sheet 준비가 필요합니다.' },
    buyerFollowUpReadiness: { score: buyerFollowUpReadiness, label: '바이어 대응', comment: hasBuyer ? '접점 바이어가 있어 Follow-up 전략이 즉시 필요합니다.' : '바이어 발굴부터 체계적으로 시작해야 합니다.' },
  };

  // 가장 약한 축을 훅 메시지에 반영
  const weakest = Object.values(sections).reduce((a, b) => (b.score < a.score ? b : a));
  const consultingLevel = overallScore >= 75 ? '보통' : '높음';

  const nextActions = [];
  if (euRegulationReadiness < 60) nextActions.push('EU 책임자(RP) 지정과 CPNP 등록 로드맵을 세우세요.');
  if (salesMaterialReadiness < 60) nextActions.push('바이어가 반응하는 영문 카탈로그/Offer Sheet를 준비하세요.');
  if (buyerFollowUpReadiness < 60) nextActions.push('목표 바이어 리스트와 Follow-up 이메일 전략을 마련하세요.');
  if (nextActions.length < 3) nextActions.push('가장 약한 영역부터 전문가와 단계별 실행 계획을 잡으세요.');

  return {
    isBasic: true,
    overallScore,
    readinessLevel,
    summary: `${request.companyName || '브랜드'}의 유럽 수출 준비도는 100점 만점에 ${overallScore}점(${readinessLevel})입니다. 특히 '${weakest.label}' 영역이 가장 큰 병목입니다.`,
    sections,
    consultingNeed: {
      level: consultingLevel,
      pitch: '이 진단은 기본 분석입니다. 바이어 매칭과 실제 계약까지 가려면, 대표님 브랜드에 맞춘 전문가 컨설팅이 결정적입니다.',
      recommendedTopics: [weakest.label, ...pains.slice(0, 2)].filter(Boolean),
    },
    nextActions: nextActions.slice(0, 3),
  };
}

// 편의: 진단 생성 후 저장까지 (관리자 수동 트리거용)
async function runAndSave(request) {
  const result = generateDiagnosis(request);
  return diagnosisService.saveDiagnosisResult(request.id, result);
}

module.exports = { generateDiagnosis, runAndSave };
