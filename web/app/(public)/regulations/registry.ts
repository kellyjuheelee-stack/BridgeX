// 유럽 규제 허브 레지스트리. 새 규제는 여기에 카드 항목을 추가하면 허브에 자동 노출.
export interface RegItem {
  slug: string;
  code: string; // 짧은 코드 (PPWR 등)
  name: string;
  desc: string;
  keyDate: string; // 핵심 시행일 표기
  keyDateLabel: string;
  status: "live" | "soon";
}

export const REGULATIONS: RegItem[] = [
  {
    slug: "ppwr",
    code: "PPWR",
    name: "포장 및 포장 폐기물 규정",
    desc: "EU로 수출되는 모든 화장품 포장(용기·펌프·박스)에 적용. 재활용 설계·재생원료·유해물질·라벨링 의무가 단계적으로 부과됩니다.",
    keyDate: "2026.08.12",
    keyDateLabel: "일반적용 개시",
    status: "live",
  },
  {
    slug: "cbam",
    code: "CBAM",
    name: "탄소국경조정제도",
    desc: "EU 수입품의 탄소배출에 대한 비용 부과. 포장·물류 전반의 탄소 데이터 관리가 요구될 예정.",
    keyDate: "준비 중",
    keyDateLabel: "콘텐츠 준비 중",
    status: "soon",
  },
  {
    slug: "green-claims",
    code: "Green Claims",
    name: "그린 클레임 지침",
    desc: "\"친환경\"·\"지속가능\" 등 환경 마케팅 문구의 근거 입증 의무화. 화장품 라벨·광고에 직접 영향.",
    keyDate: "준비 중",
    keyDateLabel: "콘텐츠 준비 중",
    status: "soon",
  },
];
