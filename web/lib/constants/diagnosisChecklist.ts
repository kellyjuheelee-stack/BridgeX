// web/lib/constants/diagnosisChecklist.ts
// 수출 준비도 체크리스트 문항 정의. UI 렌더와 엔진 입력 키의 단일 출처.

export type ChecklistKey =
  // 제품 경쟁력
  | "sellingInKorea"
  | "hasSalesRecord"
  | "hasManufacturingCert"
  // EU 규제 (필수 7요건)
  | "euRp"
  | "euCpnp"
  | "euPif"
  | "euCpsr"
  | "euInci"
  | "euLabeling"
  | "euAllergen"
  // EU 포장 규제 (PPWR)
  | "pkgRecyclable"
  | "pkgDoc"
  | "pkgTechDoc"
  | "pkgRecycledContent"
  // 영업 자료
  | "hasEnglishCatalog"
  | "hasOfferSheet"
  // 바이어 대응
  | "hasBuyer"
  | "hasExportExperience"
  | "hasTradeFairExperience";

export interface ChecklistItem {
  key: ChecklistKey;
  label: string;
}
export interface ChecklistGroup {
  area: string; // DiagnosisResult.sections 의 키와 연결되는 영역 식별
  title: string;
  note?: string;
  items: ChecklistItem[];
}

export const CHECKLIST_GROUPS: ChecklistGroup[] = [
  {
    area: "productReadiness",
    title: "제품 경쟁력",
    items: [
      { key: "sellingInKorea", label: "국내에서 판매 중이다 (자사몰·스마트스토어·오프라인 등)" },
      { key: "hasSalesRecord", label: "월 판매량 또는 베스트셀러 실적이 있다" },
      { key: "hasManufacturingCert", label: "제조 인증을 보유했다 (GMP·ISO 22716 등)" },
    ],
  },
  {
    area: "euRegulationReadiness",
    title: "EU 규제 준비 (필수 7요건)",
    note: "EU 화장품 판매에는 아래 7가지가 필수입니다.",
    items: [
      { key: "euRp", label: "EU 책임자(RP)를 지정했다" },
      { key: "euCpnp", label: "CPNP 사전 등록을 완료했다" },
      { key: "euPif", label: "제품정보파일(PIF)을 구비했다" },
      { key: "euCpsr", label: "제품안전성보고서(CPSR)를 작성했다" },
      { key: "euInci", label: "전성분(INCI) EU 규정 적합성을 확인했다" },
      { key: "euLabeling", label: "EU 라벨링 요건을 충족했다" },
      { key: "euAllergen", label: "향료 알레르겐(80종) 표시에 대응했다" },
    ],
  },
  {
    area: "euRegulationReadiness",
    title: "EU 포장 규제 (PPWR)",
    note: "2026년 8월 시행되는 EU 포장·포장폐기물 규정입니다.",
    items: [
      { key: "pkgRecyclable", label: "재활용 가능 포장재를 사용한다" },
      { key: "pkgDoc", label: "적합성 선언서(DoC)를 구비했다" },
      { key: "pkgTechDoc", label: "포장 기술 문서를 구비했다" },
      { key: "pkgRecycledContent", label: "재생원료 함량을 확인했다" },
    ],
  },
  {
    area: "salesMaterialReadiness",
    title: "영업 자료",
    items: [
      { key: "hasEnglishCatalog", label: "바이어에게 보낼 영문 카탈로그·회사소개서가 있다" },
      { key: "hasOfferSheet", label: "Offer Sheet(가격·MOQ·Incoterms)를 준비했다" },
    ],
  },
  {
    area: "buyerFollowUpReadiness",
    title: "바이어 대응",
    items: [
      { key: "hasBuyer", label: "현재 접점이 있는 바이어가 있다" },
      { key: "hasExportExperience", label: "해외 수출 경험이 있다" },
      { key: "hasTradeFairExperience", label: "박람회 참가 경험이 있다" },
    ],
  },
];

// 체크리스트로 담지 않는 맥락 선택지 (시작 화면)
export const PRODUCT_CATEGORIES = [
  "스킨케어",
  "메이크업",
  "헤어/바디",
  "향수",
  "더모코스메틱",
  "기타",
];
export const TARGET_COUNTRIES = [
  "독일",
  "프랑스",
  "이탈리아",
  "스페인",
  "폴란드",
  "네덜란드",
  "기타 EU",
];
