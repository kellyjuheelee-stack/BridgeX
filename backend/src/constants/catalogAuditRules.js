// 카탈로그 컴플라이언스 예비 점검 규칙 (모듈 2a)
//
// ⚠️ 법적 원칙: 여기 문구는 "업계에서 자주 지적되는 표현"에 대한 일반 교육 정보다.
//    "금지/위반/불법" 같은 단정 표현을 절대 쓰지 않는다. 판단은 전문가가 한다.
//    나중에 Claude 로 설명을 personalize 할 때도 이 톤을 유지한다.

const CLAIM_RULES = [
  { key: 'medicinal', category: '의약품·치료 뉘앙스',
    terms: ['치료', '치유', '여드름 치료', '염증', '항염', '재생', '콜라겐 생성', '상처', '흉터',
      'cures', 'heals', 'healing', 'treats', 'treatment', 'anti-inflammatory', 'wound'],
    why: '치료·의학 효능 뉘앙스는 화장품이 아닌 의약품으로 분류될 소지가 있어 업계에서 자주 지적됩니다.',
    hint: '"관리에 도움", "결에 도움" 등 비의학적 표현으로 검토해보세요.' },
  { key: 'antibacterial', category: '항균·살균',
    terms: ['항균', '살균', '멸균', '소독', 'antibacterial', 'antiseptic', 'disinfect', 'kills bacteria', '99.9%'],
    why: '항균·살균(특히 수치) 주장은 biocide/의약품 경계로 자주 지적됩니다.',
    hint: '세정·청결 관점의 표현으로 검토해보세요.' },
  { key: 'freefrom', category: 'free-from·무첨가',
    terms: ['무독성', '무첨가', '파라벤프리', '파라벤 프리', 'paraben-free', 'paraben free',
      'chemical-free', 'chemical free', 'toxin-free', 'non-toxic', 'free from', 'free-from'],
    why: '합법적으로 허용된 성분을 폄하하는 free-from 표현은 불공정 소지로 자주 지적됩니다.',
    hint: '넣은 성분 중심(예: "OO 성분 함유")으로 표현을 검토해보세요.' },
  { key: 'unsupported', category: '근거 필요·과장',
    terms: ['즉각', '즉시', '100%', '영구', '완벽', 'instant', 'instantly', 'permanent', 'guaranteed',
      'clinically proven', '임상 입증', '임상적으로 입증', 'dermatologist recommended', '피부과 추천'],
    why: '근거 파일 없는 즉각·수치·임상 주장은 자주 지적됩니다.',
    hint: '근거 확보 전에는 단정적 표현을 완화해 검토해보세요.' },
  { key: 'hypoallergenic', category: '저자극·hypoallergenic',
    terms: ['저자극', '무자극', '알레르기 프리', 'hypoallergenic', 'allergen-free', 'allergen free'],
    why: '일부 EU 회원국은 강한 증빙을 요구하거나 표현 자체를 문제삼는 경우가 있어 자주 지적됩니다.',
    hint: '테스트 근거를 명시하거나 표현을 완화해 검토해보세요.' },
  { key: 'compliance_benefit', category: '규제 준수를 강점처럼',
    terms: ['동물실험 하지 않', '동물실험 안', '동물실험을 하지 않', 'cruelty-free', 'cruelty free', 'not tested on animals'],
    why: 'EU에서는 동물실험을 하지 않는 것이 이미 기본 요건으로 자리잡아, 이를 차별점처럼 강조하면 오해를 살 소지가 있어 자주 지적됩니다.',
    hint: '필수 준수 사항은 핵심 강조점과 분리해 검토해보세요.' },
  { key: 'whitening', category: '미백·화이트닝',
    terms: ['미백', '화이트닝', 'whitening', 'bleaching', 'skin lightening', '피부 미백'],
    why: '"whitening/미백"은 의학·과장 뉘앙스로 받아들여져 자주 지적됩니다.',
    hint: '"brightening / even tone(톤 개선·광채)" 방향으로 검토해보세요.' },
];

const BUYER_READY_CHECKS = [
  { item: 'INCI 전성분', signals: ['inci', '전성분'], note: 'INCI 전성분 표기가 바이어 검토에 필요할 수 있습니다.' },
  { item: '인증', signals: ['gmp', 'iso 22716', 'vegan', '비건', 'cruelty', '인증'], note: '보유 인증을 명시하면 바이어 신뢰에 도움이 됩니다.' },
  { item: '거래조건(MOQ·Incoterms)', signals: ['moq', 'incoterms', 'fob', 'cif', 'exw'], note: 'MOQ·Incoterms 등 거래조건을 넣으면 바이어 문의를 줄일 수 있습니다.' },
];

const DISCLAIMER =
  '본 점검은 공개된 EU 화장품 가이드라인 기반 일반 교육 정보이며, 법률 자문이나 공식 규제 판단이 아닙니다. ' +
  '표시된 표현은 추가 검토가 필요할 수 있다는 제안일 뿐 법적 결론이 아니며, 최종 확정 전 반드시 전문 규제 컨설턴트와 상의하세요.';

const MAX_CHARS = 20000;

function auditText(text) {
  const raw = (text == null ? '' : String(text)).slice(0, MAX_CHARS);
  const lower = raw.toLowerCase();

  const findings = [];
  for (const rule of CLAIM_RULES) {
    const matched = [];
    for (const term of rule.terms) {
      if (lower.includes(term.toLowerCase())) matched.push(term);
    }
    if (matched.length) {
      // 겹치는 표현 정리: 더 긴 매칭에 포함되는 짧은 표현은 제거 (예: '여드름 치료'가 있으면 '치료' 제거)
      const deduped = matched.filter(
        (t) => !matched.some((o) => o !== t && o.toLowerCase().includes(t.toLowerCase()))
      );
      findings.push({ key: rule.key, category: rule.category, matched: deduped, why: rule.why, hint: rule.hint });
    }
  }

  const buyerReady = BUYER_READY_CHECKS.map((c) => ({
    item: c.item,
    present: c.signals.some((s) => lower.includes(s)),
    note: c.note,
  }));
  const latin = (raw.match(/[a-zA-Z]/g) || []).length;
  const englishLikely = raw.length ? latin / raw.length >= 0.3 : false;
  buyerReady.push({ item: '영문 자료', present: englishLikely, note: 'EU 바이어용 영문 자료가 필요할 수 있습니다.' });

  return {
    findings,
    buyerReady,
    summary: { flaggedCount: findings.length, checkedChars: raw.length },
    disclaimer: DISCLAIMER,
  };
}

module.exports = { CLAIM_RULES, BUYER_READY_CHECKS, DISCLAIMER, auditText };
