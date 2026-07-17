// web/app/(public)/diagnose/exampleData.ts
// 진단 폼 "예제입력" 버튼용 시연 데이터. 준비도 스펙트럼을 다르게 구성.
// 값은 모두 실제 회사와 무관한 가상 더미 데이터.
import type { ChecklistKey } from "@/lib/constants/diagnosisChecklist";

export interface DiagnoseExample {
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  homepageUrl?: string;
  smartStoreUrl?: string;
  instagramUrl?: string;
  productName: string;
  productCategory: string; // PRODUCT_CATEGORIES 중 하나와 정확히 일치
  targetCountries: string[]; // TARGET_COUNTRIES 값과 정확히 일치
  checks: Partial<Record<ChecklistKey, boolean>>; // 미기재 키 = 미체크
}

export const DIAGNOSE_EXAMPLES: DiagnoseExample[] = [
  // 세트 A — 초기 브랜드 (준비 필요 예상)
  {
    contactName: "김서연",
    companyName: "글로우데이즈",
    email: "seoyeon.kim@glowdays.co.kr",
    phone: "010-2345-6789",
    smartStoreUrl: "https://smartstore.naver.com/glowdays",
    instagramUrl: "https://instagram.com/glowdays.official",
    productName: "히알루론 수분 앰플",
    productCategory: "스킨케어",
    targetCountries: ["독일", "프랑스"],
    checks: { sellingInKorea: true, hasSalesRecord: true },
  },
  // 세트 B — 성장기 브랜드 (부분 준비됨 예상)
  {
    contactName: "이준호",
    companyName: "뷰티라운지",
    email: "junho.lee@beautylounge.kr",
    phone: "010-3456-7890",
    homepageUrl: "https://beautylounge.kr",
    smartStoreUrl: "https://smartstore.naver.com/beautylounge",
    productName: "시카 진정 크림",
    productCategory: "더모코스메틱",
    targetCountries: ["독일", "프랑스", "폴란드"],
    checks: {
      sellingInKorea: true,
      hasSalesRecord: true,
      hasManufacturingCert: true,
      euRp: true,
      euCpnp: true,
      euInci: true,
      hasEnglishCatalog: true,
      hasExportExperience: true,
    },
  },
  // 세트 C — 수출 경험 브랜드 (준비됨 근접)
  {
    contactName: "박지민",
    companyName: "온뷰티코스메틱",
    email: "jimin.park@onbeauty.com",
    phone: "010-4567-8901",
    homepageUrl: "https://onbeauty.com",
    instagramUrl: "https://instagram.com/onbeauty.global",
    productName: "레티놀 나이트 세럼",
    productCategory: "스킨케어",
    targetCountries: ["독일", "프랑스", "이탈리아", "네덜란드"],
    checks: {
      sellingInKorea: true,
      hasSalesRecord: true,
      hasManufacturingCert: true,
      euRp: true,
      euCpnp: true,
      euPif: true,
      euCpsr: true,
      euInci: true,
      euLabeling: true,
      euAllergen: true,
      pkgRecyclable: true,
      pkgDoc: true,
      hasEnglishCatalog: true,
      hasOfferSheet: true,
      hasBuyer: true,
      hasExportExperience: true,
      hasTradeFairExperience: true,
    },
  },
  // 세트 D — 메이크업 중견 (부분 준비됨, 축별 편차)
  {
    contactName: "최유나",
    companyName: "컬러팝서울",
    email: "yuna.choi@colorpopseoul.kr",
    phone: "010-5678-9012",
    homepageUrl: "https://colorpopseoul.kr",
    smartStoreUrl: "https://smartstore.naver.com/colorpopseoul",
    instagramUrl: "https://instagram.com/colorpop.seoul",
    productName: "벨벳 매트 립틴트",
    productCategory: "메이크업",
    targetCountries: ["프랑스", "스페인", "기타 EU"],
    checks: {
      sellingInKorea: true,
      hasSalesRecord: true,
      hasManufacturingCert: true,
      euRp: true,
      euLabeling: true,
      euAllergen: true,
      pkgRecyclable: true,
      pkgRecycledContent: true,
      hasEnglishCatalog: true,
      hasOfferSheet: true,
      hasBuyer: true,
    },
  },
];
