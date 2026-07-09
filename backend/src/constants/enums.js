// 지시서 5~8장의 옵션 목록. 프론트엔드 드롭다운/체크박스 렌더에 그대로 사용 가능.
// GET /api/export-diagnosis/options 로 노출된다.

const ANNUAL_REVENUE_RANGES = [
  '1억 미만',
  '1억 ~ 5억',
  '5억 ~ 10억',
  '10억 ~ 30억',
  '30억 ~ 50억',
  '50억 이상',
  '공개하고 싶지 않음',
];

const PRODUCT_CATEGORIES = [
  '스킨케어',
  '바디케어',
  '헤어케어',
  '클렌징',
  '선케어',
  '메이크업',
  '향수/프래그런스',
  '기타',
];

const HAS_INCI_OPTIONS = ['INCI 리스트 보유', '일부 보유', '보유하지 않음', '잘 모르겠음'];

const IS_SELLING_IN_KOREA_OPTIONS = ['판매 중', '출시 예정', '테스트 판매 중', '아직 판매 전'];

const CERTIFICATION_OPTIONS = [
  'CGMP',
  'ISO 22716',
  '비건 인증',
  'EWG',
  '피부 임상',
  '저자극 테스트',
  '기능성 인증',
  '특허/상표',
  '없음',
  '잘 모르겠음',
  '기타',
];

const TARGET_COUNTRY_OPTIONS = [
  'France',
  'Germany',
  'Italy',
  'Spain',
  'Netherlands',
  'Belgium',
  'Poland',
  'Sweden',
  'United Kingdom',
  '기타 유럽 국가',
  '아직 정하지 못함',
];

const PREFERRED_CHANNEL_OPTIONS = [
  '편집숍',
  '약국/더마코스메틱 채널',
  '온라인몰',
  '유통사/디스트리뷰터',
  'B2B 바이어',
  '아마존/마켓플레이스',
  '살롱/스파/전문점',
  '아직 정하지 못함',
];

const EXPORT_EXPERIENCE_OPTIONS = [
  '없음',
  '샘플 발송 경험 있음',
  '바이어 미팅 경험 있음',
  '수출 계약 경험 있음',
  '현재 수출 중',
];

const TRADE_FAIR_EXPERIENCE_OPTIONS = [
  '참가 경험 없음',
  '국내 박람회 참가 경험 있음',
  '해외 박람회 참가 경험 있음',
  '참가 예정',
  '박람회에서 바이어를 만난 적 있음',
];

const HAS_EXISTING_BUYER_OPTIONS = [
  '있음',
  '없음',
  '대화 중인 바이어는 있으나 진행이 멈춤',
  '잘 모르겠음',
];

const PAIN_POINT_OPTIONS = [
  '어떤 국가부터 시작해야 할지 모르겠어요',
  '유럽 규제/허가가 어렵습니다',
  '영문 회사소개서/카탈로그가 없습니다',
  '박람회 이후 바이어 Follow-up이 안 됩니다',
  '가격표, MOQ, Incoterms 설정이 어렵습니다',
  '바이어와 이메일/미팅/협상이 어렵습니다',
  '계약 직전 검토가 필요합니다',
];

// EU 규제 준비 현황 (Regulation (EC) 1223/2009 핵심 요건)
const EU_COMPLIANCE_OPTIONS = [
  'EU 책임자(Responsible Person) 지정',
  'CPNP 사전 등록',
  '제품정보파일(PIF) 구비',
  '제품안전성보고서(CPSR) 작성',
  '전성분(INCI) EU 규정 적합성 확인',
  'EU 라벨링 요건 충족',
  '향료 알레르겐(80종) 표시 대응',
  '아직 준비된 항목 없음',
  '잘 모르겠음',
];

// 포장재 규제 준비 현황 (EU PPWR, 2026.8 시행)
const PACKAGING_READINESS_OPTIONS = [
  '재활용 가능 포장재 사용',
  '적합성 선언서(DoC) 구비',
  '기술 문서 구비',
  '재생원료 함량 확인',
  '준비 중',
  '아직 준비 안 됨',
  'PPWR을 처음 들어봄',
];

// 컨설팅 파이프라인 (상담 신청 → 계약까지의 단계 + 단계별 체크리스트)
const CONSULTING_STAGES = [
  { key: 'booking', label: '상담 예약', items: [
    { key: 'book_schedule', label: '상담 일정 확정' },
    { key: 'book_method', label: '상담 방식 결정 (화상/전화/대면)' },
    { key: 'book_prep', label: '사전 자료 요청 (제품·성분·판매실적)' },
  ]},
  { key: 'firstConsult', label: '1차 상담', items: [
    { key: 'fc_market', label: '목표 시장·채널 확인' },
    { key: 'fc_review', label: '진단 결과 리뷰' },
    { key: 'fc_budget', label: '예산·일정·기대치 파악' },
    { key: 'fc_priority', label: '우선순위 과제 합의' },
  ]},
  { key: 'regDocs', label: '규제/서류 준비', items: [
    { key: 'rd_rp', label: 'EU 책임자(RP) 지정 방안' },
    { key: 'rd_cpnp', label: 'CPNP 등록 계획' },
    { key: 'rd_pif', label: 'PIF·CPSR 준비' },
    { key: 'rd_inci', label: '전성분 EU 적합성 검토' },
    { key: 'rd_label', label: '라벨링·PPWR 대응' },
  ]},
  { key: 'materials', label: '영문 자료 제작', items: [
    { key: 'mt_company', label: '영문 회사소개서' },
    { key: 'mt_catalog', label: '제품 카탈로그' },
    { key: 'mt_offer', label: 'Offer Sheet / 가격표 (MOQ·Incoterms)' },
  ]},
  { key: 'buyerOutreach', label: '바이어 발굴·컨택', items: [
    { key: 'bo_list', label: '목표 바이어 리스트업' },
    { key: 'bo_email', label: '콜드 이메일 발송' },
    { key: 'bo_followup', label: '응답·후속 관리' },
  ]},
  { key: 'negotiation', label: '미팅·협상', items: [
    { key: 'ng_meeting', label: '온라인/오프라인 미팅' },
    { key: 'ng_terms', label: '조건 협상 (가격·MOQ·독점권)' },
    { key: 'ng_sample', label: '샘플 발송' },
  ]},
  { key: 'contract', label: '계약', items: [
    { key: 'ct_draft', label: '계약서 초안 검토' },
    { key: 'ct_final', label: '최종 조건 확정' },
    { key: 'ct_sign', label: '계약 체결' },
  ]},
];

// 진단 상태값 (지시서 8장)
const DIAGNOSIS_STATUSES = [
  'submitted', // 제출 완료
  'reviewing', // 검토 중
  'ai_generated', // AI 진단 초안 생성 완료
  'consulting_needed', // 컨설팅 필요
  'completed', // 진단 완료
  'archived', // 보관/종료
];

// 파일 업로드 허용 확장자 (지시서 9.5 / 11장)
const ALLOWED_FILE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf', 'xlsx', 'docx'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 파일 1개당 10MB
const MAX_TOTAL_UPLOAD_BYTES = 50 * 1024 * 1024; // 총 50MB

module.exports = {
  ANNUAL_REVENUE_RANGES,
  PRODUCT_CATEGORIES,
  HAS_INCI_OPTIONS,
  IS_SELLING_IN_KOREA_OPTIONS,
  CERTIFICATION_OPTIONS,
  EU_COMPLIANCE_OPTIONS,
  PACKAGING_READINESS_OPTIONS,
  CONSULTING_STAGES,
  TARGET_COUNTRY_OPTIONS,
  PREFERRED_CHANNEL_OPTIONS,
  EXPORT_EXPERIENCE_OPTIONS,
  TRADE_FAIR_EXPERIENCE_OPTIONS,
  HAS_EXISTING_BUYER_OPTIONS,
  PAIN_POINT_OPTIONS,
  DIAGNOSIS_STATUSES,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_UPLOAD_BYTES,
};
