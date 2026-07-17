// web/lib/services/diagnosis/generateDiagnosis.ts
// 규칙 기반 자동 진단(훅). 구 backend/src/services/aiDiagnosis.service.js 공식 계승,
// 입력만 ChecklistAnswers 로 개편. 향후 LLM 교체 지점은 comment/summary/pitch 문구뿐.
import type { ChecklistAnswers, DiagnosisResult, Priority } from "./types";

// EU 필수 7요건: 체크 키 → 화면 표기 라벨 (결과 시각화와 단일 출처로 공유)
export const EU_ITEMS: { key: keyof ChecklistAnswers; label: string }[] = [
  { key: "euRp", label: "EU 책임자(RP) 지정" },
  { key: "euCpnp", label: "CPNP 사전 등록" },
  { key: "euPif", label: "PIF(제품정보파일) 구비" },
  { key: "euCpsr", label: "CPSR(안전성보고서) 작성" },
  { key: "euInci", label: "INCI 전성분 적합성" },
  { key: "euLabeling", label: "EU 라벨링 요건" },
  { key: "euAllergen", label: "향료 알레르겐 표시" },
];
// EU 포장 규제(PPWR) 4항목: 결과 시각화에서 확보/미비 복원에 사용
export const PACKAGING_ITEMS: { key: keyof ChecklistAnswers; label: string }[] = [
  { key: "pkgRecyclable", label: "재활용 가능 포장재 사용" },
  { key: "pkgDoc", label: "적합성 선언서(DoC) 구비" },
  { key: "pkgTechDoc", label: "포장 기술 문서 구비" },
  { key: "pkgRecycledContent", label: "재생원료 함량 확인" },
];
const PKG_KEYS: (keyof ChecklistAnswers)[] = PACKAGING_ITEMS.map((x) => x.key);

function clamp(n: number): number {
  return Math.max(5, Math.min(98, Math.round(n)));
}

export function generateDiagnosis(a: ChecklistAnswers): DiagnosisResult {
  const company = a.companyName || "브랜드";

  // 1) 제품 경쟁력
  const productReadiness = clamp(
    45 + (a.sellingInKorea ? 25 : 0) + (a.hasManufacturingCert ? 18 : 0) + (a.hasSalesRecord ? 10 : 0)
  );

  // 2) EU 규제 준비 (핵심 7요건 + PPWR)
  const euHave = EU_ITEMS.filter((x) => a[x.key]).length; // 0..7
  const euNone = euHave === 0;
  const euBase = euNone ? 20 : 20 + (euHave / EU_ITEMS.length) * 70; // 20..90
  const pkgReady = PKG_KEYS.filter((k) => a[k]).length; // 0..4
  const pkgScore = pkgReady > 0 ? 50 + pkgReady * 10 : 20; // 0개 체크 → 20 (중간값 40 미표현)
  const euRegulationReadiness = clamp(euBase * 0.8 + pkgScore * 0.2);

  // 3) 영업 자료
  let sales = 62;
  if (!a.hasEnglishCatalog) sales -= 22;
  if (a.hasOfferSheet) sales += 15;
  const salesMaterialReadiness = clamp(sales);

  // 4) 바이어 대응
  let follow = 45 + (a.hasBuyer ? 25 : 0) + (a.hasExportExperience ? 15 : 0);
  if (!a.hasTradeFairExperience) follow -= 15;
  const buyerFollowUpReadiness = clamp(follow);

  const overallScore = Math.round(
    (productReadiness + euRegulationReadiness + salesMaterialReadiness + buyerFollowUpReadiness) / 4
  );
  const readinessLevel =
    overallScore >= 75 ? "준비됨" : overallScore >= 55 ? "부분 준비됨" : "준비 필요";

  // ── 갭 산출 ──
  const missingEu = EU_ITEMS.filter((x) => !a[x.key]).map((x) => x.label);
  const pkgMissing = pkgReady === 0;

  const productGaps: string[] = [];
  if (!a.sellingInKorea) productGaps.push("국내 판매 실적/레퍼런스");
  if (!a.hasManufacturingCert) productGaps.push("인증 확보(GMP·ISO 22716 등)");

  const euGaps = missingEu.slice();
  if (pkgMissing) euGaps.push("PPWR 포장 규정 대응");

  const salesGaps: string[] = [];
  if (!a.hasEnglishCatalog) salesGaps.push("영문 카탈로그·회사소개서");
  if (!a.hasOfferSheet) salesGaps.push("Offer Sheet(가격·MOQ·Incoterms)");

  const buyerGaps: string[] = [];
  if (!a.hasBuyer) buyerGaps.push("타겟 바이어 리스트");
  if (!a.hasTradeFairExperience || !a.hasExportExperience) buyerGaps.push("바이어 Follow-up 전략");

  const sections = {
    productReadiness: {
      score: productReadiness,
      label: "제품 경쟁력",
      comment: a.sellingInKorea
        ? "국내 판매 실적이 있어 바이어 설득의 근거가 됩니다."
        : "국내 판매 실적/인증을 보강하면 신뢰도가 올라갑니다.",
      gaps: productGaps,
    },
    euRegulationReadiness: {
      score: euRegulationReadiness,
      label: "EU 규제 준비",
      comment: euNone
        ? "책임자(RP)·CPNP·PIF 등 필수 요건 준비가 시급합니다."
        : `핵심 요건 ${euHave}/7개 확보. 남은 항목과 PPWR 대응이 필요합니다.`,
      gaps: euGaps,
    },
    salesMaterialReadiness: {
      score: salesMaterialReadiness,
      label: "영업 자료",
      comment: a.hasEnglishCatalog
        ? "영문 자료가 있어 바이어 검토를 앞당길 수 있습니다."
        : "영문 카탈로그·Offer Sheet 준비가 필요합니다.",
      gaps: salesGaps,
    },
    buyerFollowUpReadiness: {
      score: buyerFollowUpReadiness,
      label: "바이어 대응",
      comment: a.hasBuyer
        ? "접점 바이어가 있어 Follow-up 전략이 즉시 필요합니다."
        : "바이어 발굴부터 체계적으로 시작해야 합니다.",
      gaps: buyerGaps,
    },
  };

  // 가장 약한 축
  const weakest = Object.values(sections).reduce((acc, s) => (s.score < acc.score ? s : acc));
  const consultingLevel: "보통" | "높음" = overallScore >= 75 ? "보통" : "높음";

  // ── 우선 해결 과제 Top 3 (구 엔진 가중치 계승) ──
  const pool: { weight: number; label: string; note: string }[] = [];
  if (missingEu.length >= 3) {
    pool.push({
      weight: 100,
      label: `EU 필수 요건 ${missingEu.length}개 미비`,
      note: `${missingEu.slice(0, 3).join(", ")} 등 — EU 판매 전 반드시 갖춰야 하며, 대부분 전문가 준비가 필요합니다.`,
    });
  } else {
    missingEu.forEach((l) =>
      pool.push({ weight: 95, label: `${l} 준비`, note: "EU 판매를 위한 필수 요건입니다." })
    );
  }
  if (salesMaterialReadiness < 62)
    pool.push({
      weight: 60,
      label: "바이어용 영문 자료 준비",
      note: "영문 카탈로그·Offer Sheet가 있어야 바이어가 검토를 시작합니다.",
    });
  if (!a.hasBuyer)
    pool.push({ weight: 74, label: "타겟 바이어 발굴", note: "검증된 바이어 리스트 확보는 전문가의 핵심 영역입니다." });
  else
    pool.push({
      weight: 66,
      label: "바이어 Follow-up·협상 전략",
      note: "접점 바이어를 실제 계약까지 잇는 전략이 필요합니다.",
    });
  if (pkgMissing)
    pool.push({ weight: 52, label: "PPWR 포장 규정 대응", note: "새 EU 포장 규정에 맞춘 대응 전략을 세워야 합니다." });
  if (!a.hasManufacturingCert)
    pool.push({ weight: 44, label: "인증 확보", note: "GMP·ISO 22716·비건 등 인증이 바이어 신뢰를 높입니다." });

  const priorities: Priority[] = pool
    .sort((x, y) => y.weight - x.weight)
    .slice(0, 3)
    .map(({ label, note }) => ({ label, note }));

  const euStatus = { haveCount: euHave, total: EU_ITEMS.length, missing: missingEu };

  // ── 맞춤 요약 / 컨설팅 훅 ──
  const euGapLine = missingEu.length
    ? ` EU 필수 요건 ${EU_ITEMS.length}개 중 ${missingEu.length}개(${missingEu.slice(0, 2).join(", ")} 등)가 아직 준비되지 않았습니다.`
    : " EU 필수 요건은 대체로 갖추셨습니다.";
  const summary = `${company}의 유럽 수출 준비도는 100점 만점에 ${overallScore}점(${readinessLevel})입니다.${euGapLine} 특히 '${weakest.label}' 영역이 가장 큰 병목입니다.`;

  const topGap = priorities[0] ? priorities[0].label : weakest.label;
  const pitch = `이 진단은 기본 분석입니다. 특히 '${topGap}'은(는) 혼자 해결하기 어렵습니다. 바이어 매칭과 실제 계약까지 가려면, 대표님 브랜드에 맞춘 전문가 컨설팅이 결정적입니다.`;

  const recommendedTopics = Array.from(
    new Set([weakest.label, ...priorities.slice(0, 2).map((p) => p.label)])
  );

  const nextActions: string[] = [];
  if (euRegulationReadiness < 60) nextActions.push("EU 책임자(RP) 지정과 CPNP 등록 로드맵을 세우세요.");
  if (salesMaterialReadiness < 60) nextActions.push("바이어가 반응하는 영문 카탈로그/Offer Sheet를 준비하세요.");
  if (buyerFollowUpReadiness < 60) nextActions.push("목표 바이어 리스트와 Follow-up 이메일 전략을 마련하세요.");
  if (nextActions.length < 3) nextActions.push("가장 약한 영역부터 전문가와 단계별 실행 계획을 잡으세요.");

  return {
    isBasic: true,
    overallScore,
    readinessLevel,
    summary,
    sections,
    euStatus,
    priorities,
    consultingNeed: {
      level: consultingLevel,
      pitch,
      recommendedTopics,
    },
    nextActions: nextActions.slice(0, 3),
  };
}
