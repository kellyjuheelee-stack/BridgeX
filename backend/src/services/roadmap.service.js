// 수출 실행 로드맵 — 진단 데이터를 16단계 실행 로드맵으로 변환한다.
// 뼈대·판정은 규칙 기반(무료·즉시). 나중에 각 단계 comment() 만 Claude 로 교체하면 된다.
//
// tag: 'self'(🟢 회원이 도구로 직접) | 'expert'(🔴 전문가/컨설팅) | 'hybrid'(🟡 셀프 점검 후 전문가)
// link.type: 'info'(자동판정, 이동 없음) | 'tool'(href 페이지) | 'consulting'(상담신청) | 'soon'(모듈2 준비중)

const PKG_READY = ['재활용 가능 포장재 사용', '적합성 선언서(DoC) 구비', '기술 문서 구비', '재생원료 함량 확인'];

function has(arr, v) { return Array.isArray(arr) && arr.indexOf(v) !== -1; }
function hasAny(arr, list) { return Array.isArray(arr) && arr.some((x) => list.indexOf(x) !== -1); }

function deriveContext(d) {
  d = d || {};
  const certs = d.certifications || [];
  const files = d.productFiles || [];
  return {
    eu: d.euComplianceReadiness || [],
    pkg: d.packagingReadiness || [],
    sellingInKorea: ['판매 중', '테스트 판매 중'].indexOf(d.isSellingInKorea) !== -1,
    hasRealCerts: Array.isArray(certs) && certs.some((c) => ['없음', '잘 모르겠음'].indexOf(c) === -1),
    hasBrochure: Array.isArray(files) && files.length > 0,
  };
}

const STEP_DEFS = [
  // ── 기반: 제품·규제 ──
  { id: 'domestic_proof', phase: 'foundation', title: '국내 판매 실적·인증 정리', tag: 'self',
    link: { type: 'info' }, done: (c) => c.sellingInKorea && c.hasRealCerts,
    comment: '국내 판매 실적·인증은 바이어 설득의 근거입니다. 진단 정보에서 자동 확인됩니다.' },
  { id: 'eu_rp', phase: 'foundation', title: 'EU 책임자(RP) 지정', tag: 'expert',
    link: { type: 'consulting' }, done: (c) => has(c.eu, 'EU 책임자(Responsible Person) 지정'),
    comment: 'EU 판매엔 역내 책임자(RP)가 법적으로 필요합니다. 지정·계약은 전문가 영역입니다.' },
  { id: 'eu_cpnp', phase: 'foundation', title: 'CPNP 사전 등록', tag: 'expert',
    link: { type: 'consulting' }, done: (c) => has(c.eu, 'CPNP 사전 등록'),
    comment: 'CPNP(EU 화장품 사전신고) 없이는 판매가 불가합니다. 등록 절차는 전문가와 진행하세요.' },
  { id: 'eu_pif', phase: 'foundation', title: '제품정보파일(PIF) 구비', tag: 'expert',
    link: { type: 'consulting' }, done: (c) => has(c.eu, '제품정보파일(PIF) 구비'),
    comment: 'PIF는 규제 당국 요청 시 즉시 제출해야 하는 필수 문서입니다.' },
  { id: 'eu_cpsr', phase: 'foundation', title: '제품안전성보고서(CPSR) 작성', tag: 'expert',
    link: { type: 'consulting' }, done: (c) => has(c.eu, '제품안전성보고서(CPSR) 작성'),
    comment: 'CPSR은 자격을 갖춘 안전성 평가자만 작성할 수 있습니다.' },
  { id: 'eu_inci', phase: 'foundation', title: 'INCI 전성분 EU 적합성 확인', tag: 'hybrid',
    link: { type: 'consulting' }, done: (c) => has(c.eu, '전성분(INCI) EU 규정 적합성 확인'),
    comment: '전성분을 EU 금지·제한 성분과 대조해야 합니다. 기초 점검 후 전문가 확정이 필요합니다.' },
  { id: 'eu_labeling', phase: 'foundation', title: 'EU 라벨링·알레르겐 표시', tag: 'expert',
    link: { type: 'consulting' },
    done: (c) => has(c.eu, 'EU 라벨링 요건 충족') && has(c.eu, '향료 알레르겐(80종) 표시 대응'),
    comment: 'EU 라벨 요건과 향료 알레르겐 표시는 위반 시 통관이 막힙니다.' },
  { id: 'eu_ppwr', phase: 'foundation', title: 'PPWR 포장 대응', tag: 'expert',
    link: { type: 'consulting' }, done: (c) => hasAny(c.pkg, PKG_READY),
    comment: '새 EU 포장규정(PPWR)은 재활용성·문서화를 요구합니다. 대응 전략이 필요합니다.' },
  // ── 영업 자료 (모듈 2 연결) ──
  { id: 'catalog_generate', phase: 'sales', title: 'AI 브랜드 카탈로그·회사소개 생성', tag: 'self',
    link: { type: 'soon', label: '준비 중' }, showIf: (c) => !c.hasBrochure, done: () => false,
    comment: '브로셔가 없어도 로고·제품 정보로 바이어용 영문 카탈로그를 만들 수 있습니다. (곧 제공)' },
  { id: 'catalog_audit', phase: 'sales', title: '기존 카탈로그 업로드·바이어레디 진단', tag: 'hybrid',
    link: { type: 'soon', label: '준비 중' }, showIf: (c) => c.hasBrochure, done: () => false,
    comment: '한국 카탈로그엔 EU 금지 표현(미백·효능 등)이 있을 수 있습니다. 업로드하면 점검해 드립니다. (곧 제공)' },
  { id: 'offer_sheet', phase: 'sales', title: 'Offer Sheet(가격·MOQ·Incoterms)', tag: 'hybrid',
    link: { type: 'consulting' }, done: () => false,
    comment: '바이어는 명확한 가격·MOQ·Incoterms를 원합니다. 조건 설계는 전문가와 다듬으세요.' },
  // ── 바이어 ──
  { id: 'buyer_list', phase: 'buyer', title: '타겟 바이어 리스트', tag: 'expert',
    link: { type: 'consulting' }, done: () => false,
    comment: '검증된 바이어 발굴은 BridgeX 전문가의 핵심 영역입니다(AI 자동발굴은 신뢰성 문제로 하지 않습니다).' },
  { id: 'outreach_cold', phase: 'buyer', title: '콜드 아웃리치 이메일', tag: 'self',
    link: { type: 'tool', href: 'email.html' }, done: () => false,
    comment: 'AI 이메일 도구로 내 제품 정보를 반영한 영문 콜드메일 초안을 바로 만드세요.' },
  { id: 'followup', phase: 'buyer', title: '박람회 후속·리마인더', tag: 'self',
    link: { type: 'tool', href: 'email.html' }, done: () => false,
    comment: '박람회 후속·미응답 리마인더도 AI 이메일 도구에서 상황별로 생성됩니다.' },
  { id: 'interest_reply', phase: 'buyer', title: '관심 답장 대응', tag: 'self',
    link: { type: 'tool', href: 'email.html' }, done: () => false,
    comment: '바이어가 관심을 보이면 조건·다음 단계 안내 초안을 AI 이메일 도구에서 만드세요.' },
  { id: 'meeting_negotiation', phase: 'buyer', title: '미팅·협상', tag: 'expert',
    link: { type: 'consulting' }, done: () => false,
    comment: '실제 미팅·가격 협상은 성패를 가릅니다. 전문가가 동행·코칭합니다.' },
  { id: 'contract', phase: 'buyer', title: '계약', tag: 'expert',
    link: { type: 'consulting' }, done: () => false,
    comment: '계약 조건·리스크 검토는 반드시 전문가와 진행하세요.' },
];

const STEP_IDS = STEP_DEFS.map((d) => d.id);

function buildRoadmap(diagnosis, progress) {
  progress = progress || {};
  const c = deriveContext(diagnosis);
  const steps = STEP_DEFS.filter((def) => !def.showIf || def.showIf(c)).map((def) => {
    const derivedDone = !!def.done(c);
    const override = progress[def.id];
    const done = override ? !!override.done : derivedDone;
    return {
      id: def.id,
      phase: def.phase,
      title: def.title,
      tag: def.tag,
      link: def.link,
      derivedDone,
      done,
      comment: def.comment, // ← 나중에 Claude 로 교체할 지점
    };
  });
  const total = steps.length;
  const doneCount = steps.filter((s) => s.done).length;
  const expertRemaining = steps.filter((s) => (s.tag === 'expert' || s.tag === 'hybrid') && !s.done).length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  return { steps, progress: { total, doneCount, expertRemaining, percent } };
}

function isValidStepId(id) { return STEP_IDS.indexOf(id) !== -1; }

module.exports = { buildRoadmap, isValidStepId, STEP_IDS };
