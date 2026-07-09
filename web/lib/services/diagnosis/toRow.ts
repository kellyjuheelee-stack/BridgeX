// web/lib/services/diagnosis/toRow.ts
// 체크리스트 응답 + 맥락 → export_diagnosis_requests 삽입 행.
// 원본은 checklist_answers 에, 관리자 호환 레거시 컬럼은 파생 채움.
import type { ChecklistAnswers, DiagnosisResult } from "./types";

export interface DiagnoseInput {
  contact: {
    contactName: string;
    companyName: string;
    email: string;
    phone: string;
    homepageUrl: string | null;
    smartStoreUrl: string | null;
    instagramUrl: string | null;
  };
  product: {
    productName: string;
    productCategory: string;
    targetCountries: string[];
  };
  answers: ChecklistAnswers;
  consentedAt: string; // 동의 시각(참고 로그용, DB 컬럼 아님이면 무시 가능)
  memberId: string | null;
}

// EU 체크 키 → 레거시 eu_compliance_readiness 표기(구 진단 옵션과 동일 문자열)
const EU_LEGACY: Record<string, string> = {
  euRp: "EU 책임자(Responsible Person) 지정",
  euCpnp: "CPNP 사전 등록",
  euPif: "제품정보파일(PIF) 구비",
  euCpsr: "제품안전성보고서(CPSR) 작성",
  euInci: "전성분(INCI) EU 규정 적합성 확인",
  euLabeling: "EU 라벨링 요건 충족",
  euAllergen: "향료 알레르겐(80종) 표시 대응",
};
const PKG_LEGACY: Record<string, string> = {
  pkgRecyclable: "재활용 가능 포장재 사용",
  pkgDoc: "적합성 선언서(DoC) 구비",
  pkgTechDoc: "기술 문서 구비",
  pkgRecycledContent: "재생원료 함량 확인",
};

export function toRow(input: DiagnoseInput, result: DiagnosisResult): Record<string, unknown> {
  const a = input.answers;

  const eu = Object.entries(EU_LEGACY)
    .filter(([k]) => a[k as keyof ChecklistAnswers])
    .map(([, label]) => label);
  const pkg = Object.entries(PKG_LEGACY)
    .filter(([k]) => a[k as keyof ChecklistAnswers])
    .map(([, label]) => label);
  const certifications = a.hasManufacturingCert ? ["GMP·ISO 22716 등"] : [];

  return {
    // 연락처
    contact_name: input.contact.contactName,
    company_name: input.contact.companyName,
    email: input.contact.email,
    phone: input.contact.phone,
    homepage_url: input.contact.homepageUrl,
    smart_store_url: input.contact.smartStoreUrl,
    instagram_url: input.contact.instagramUrl,
    // 제품 맥락
    product_name: input.product.productName,
    product_category: input.product.productCategory,
    target_countries: input.product.targetCountries,
    // 원본 응답
    checklist_answers: a,
    // 레거시 파생(관리자 화면 호환)
    certifications,
    eu_compliance_readiness: eu,
    packaging_readiness: pkg,
    is_selling_in_korea: a.sellingInKorea ? "판매 중" : "판매 안 함",
    monthly_sales_or_best_seller: a.hasSalesRecord ? "있음" : null,
    export_experience: a.hasExportExperience ? "있음" : "없음",
    trade_fair_experience: a.hasTradeFairExperience ? "있음" : "없음",
    has_existing_buyer: a.hasBuyer ? "있음" : "없음",
    // 진단 상태
    diagnosis_status: "submitted",
    diagnosis_result: result,
    consultation_requested: false,
    submitted_at: input.consentedAt,
    // 회원 연결
    member_id: input.memberId,
  };
}
