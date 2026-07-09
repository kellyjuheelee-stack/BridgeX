// web/lib/constants/consulting.ts
// 컨설팅 파이프라인 단계 + 단계별 체크리스트. backend/src/constants/enums.js 의
// CONSULTING_STAGES 를 그대로 포팅한 것 — key/label/순서를 레거시와 정확히 일치시킨다.
// 관리자 백오피스(컨설팅 트랙) 렌더의 단일 출처.

export interface ConsultingStage {
  key: string;
  title: string;
}

export interface ChecklistItem {
  key: string;
  label: string;
}

export interface ConsultingChecklistGroup {
  stageKey: string;
  items: ChecklistItem[];
}

// 7단계 파이프라인 (상담 예약 → 계약)
export const CONSULTING_STAGES: ConsultingStage[] = [
  { key: "booking", title: "상담 예약" },
  { key: "firstConsult", title: "1차 상담" },
  { key: "regDocs", title: "규제/서류 준비" },
  { key: "materials", title: "영문 자료 제작" },
  { key: "buyerOutreach", title: "바이어 발굴·컨택" },
  { key: "negotiation", title: "미팅·협상" },
  { key: "contract", title: "계약" },
];

// 단계별 체크리스트 (총 24개 항목). stageKey 는 CONSULTING_STAGES.key 와 연결.
export const CONSULTING_CHECKLIST: ConsultingChecklistGroup[] = [
  {
    stageKey: "booking",
    items: [
      { key: "book_schedule", label: "상담 일정 확정" },
      { key: "book_method", label: "상담 방식 결정 (화상/전화/대면)" },
      { key: "book_prep", label: "사전 자료 요청 (제품·성분·판매실적)" },
    ],
  },
  {
    stageKey: "firstConsult",
    items: [
      { key: "fc_market", label: "목표 시장·채널 확인" },
      { key: "fc_review", label: "진단 결과 리뷰" },
      { key: "fc_budget", label: "예산·일정·기대치 파악" },
      { key: "fc_priority", label: "우선순위 과제 합의" },
    ],
  },
  {
    stageKey: "regDocs",
    items: [
      { key: "rd_rp", label: "EU 책임자(RP) 지정 방안" },
      { key: "rd_cpnp", label: "CPNP 등록 계획" },
      { key: "rd_pif", label: "PIF·CPSR 준비" },
      { key: "rd_inci", label: "전성분 EU 적합성 검토" },
      { key: "rd_label", label: "라벨링·PPWR 대응" },
    ],
  },
  {
    stageKey: "materials",
    items: [
      { key: "mt_company", label: "영문 회사소개서" },
      { key: "mt_catalog", label: "제품 카탈로그" },
      { key: "mt_offer", label: "Offer Sheet / 가격표 (MOQ·Incoterms)" },
    ],
  },
  {
    stageKey: "buyerOutreach",
    items: [
      { key: "bo_list", label: "목표 바이어 리스트업" },
      { key: "bo_email", label: "콜드 이메일 발송" },
      { key: "bo_followup", label: "응답·후속 관리" },
    ],
  },
  {
    stageKey: "negotiation",
    items: [
      { key: "ng_meeting", label: "온라인/오프라인 미팅" },
      { key: "ng_terms", label: "조건 협상 (가격·MOQ·독점권)" },
      { key: "ng_sample", label: "샘플 발송" },
    ],
  },
  {
    stageKey: "contract",
    items: [
      { key: "ct_draft", label: "계약서 초안 검토" },
      { key: "ct_final", label: "최종 조건 확정" },
      { key: "ct_sign", label: "계약 체결" },
    ],
  },
];

// 특정 단계의 체크리스트 항목을 조회 (없으면 빈 배열).
export function checklistForStage(stageKey: string | null | undefined): ChecklistItem[] {
  if (!stageKey) return [];
  return CONSULTING_CHECKLIST.find((g) => g.stageKey === stageKey)?.items ?? [];
}

// 진단 상태값 (backend enums.js DIAGNOSIS_STATUSES 와 동일 순서/키).
export const DIAGNOSIS_STATUSES = [
  "submitted",
  "reviewing",
  "ai_generated",
  "consulting_needed",
  "completed",
  "archived",
] as const;

export type DiagnosisStatus = (typeof DIAGNOSIS_STATUSES)[number];

// 관리자 UI 상태 라벨 (admin.html STATUS_LABELS 와 동일).
export const STATUS_LABELS: Record<string, string> = {
  submitted: "제출 완료",
  reviewing: "검토 중",
  ai_generated: "AI 초안 생성",
  consulting_needed: "컨설팅 필요",
  completed: "진단 완료",
  archived: "보관/종료",
};
