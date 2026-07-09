# 카탈로그 컴플라이언스 진단 (모듈 2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 회원이 카탈로그 문구를 붙여넣으면 EU에서 자주 지적되는 표현을 규칙 기반으로 짚어주고, 판단은 전문가(컨설팅)로 넘기는 무료 도구를 만든다.

**Architecture:** 순수 규칙 함수 `catalogAuditRules.auditText(text)`가 발견·바이어레디·면책을 산출. 회원 API `POST /me/catalog-audit`가 이를 감싸고 회원 최신 진단 id를 함께 반환. 프론트 `catalog.html`(email.html 구조)이 붙여넣기→결과→벽 CTA를 처리. 로드맵 `catalog_audit` 단계와 마이페이지 도구 카드에서 연결.

**Tech Stack:** Node 18+ (내장 fetch/test), Express 4, 정적 HTML(바닐라 JS). 신규 의존성 없음.

## Global Constraints

- **법적 리스크 회피(최우선):** "금지/위반/불법" 등 **단정 표현 절대 금지.** 톤은 **"업계에서 자주 지적됨 · 검토 권장"** 만. 결과에 **면책 문구 상시 노출**. 판단은 전문가로 이관.
- 규칙/문구는 `backend/src/constants/catalogAuditRules.js` 한 곳에 분리(대표님이 문구만 수정 가능).
- 매칭은 입력 텍스트 **소문자화 후 부분일치(`includes`)**. 입력 상한 20000자(초과 시 잘라서 스캔).
- 회원 인증은 기존 `requireMember`. 벽 CTA는 회원 최신 진단 id(`diagnosisId`)를 써서 기존 `POST /api/export-diagnosis/:id/request-consultation`(stepContext='카탈로그 컴플라이언스 검토') 호출. id 없으면 진단 유도.
- v1 = **저장 없음**(즉석). 파일 업로드·자산 라이브러리·PDF 파싱 제외.
- 테스트: 순수 로직 `node --test`, 엔드투엔드 smoke 스크립트. 커밋 `feat:` 프리픽스. 브랜치 `feature/catalog-audit`.
- 기존 정적 서버(python 4599)·백엔드(4000) 재사용.

---

### Task 1: catalogAuditRules.js — 스캔 규칙 + auditText()

**Files:**
- Create: `backend/src/constants/catalogAuditRules.js`
- Test: `backend/tests/catalog-audit.test.mjs`
- Modify: `backend/package.json` (scripts: `test:catalog`, `smoke:catalog`)

**Interfaces:**
- Produces:
  - `auditText(text) → { findings, buyerReady, summary, disclaimer }`
    - `findings`: `[{ key, category, matched: string[], why, hint }]`
    - `buyerReady`: `[{ item, present: boolean, note }]`
    - `summary`: `{ flaggedCount, checkedChars }`
    - `disclaimer`: string
  - `CLAIM_RULES`, `BUYER_READY_CHECKS`, `DISCLAIMER`

- [ ] **Step 1: 실패 테스트 작성**

Create `backend/tests/catalog-audit.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { auditText, DISCLAIMER } = require('../src/constants/catalogAuditRules.js');

test('위험 표현 감지: 미백 + 치료', () => {
  const r = auditText('이 제품은 미백에 좋고 여드름 치료에 효과적입니다.');
  const keys = r.findings.map((f) => f.key);
  assert.ok(keys.includes('whitening'));
  assert.ok(keys.includes('medicinal'));
  assert.equal(r.summary.flaggedCount, r.findings.length);
});

test('영문 whitening/anti-inflammatory 감지', () => {
  const r = auditText('Our whitening cream is anti-inflammatory.');
  const keys = r.findings.map((f) => f.key);
  assert.ok(keys.includes('whitening'));
  assert.ok(keys.includes('medicinal'));
});

test('발견마다 category·why·hint·matched 포함', () => {
  const r = auditText('미백 화이트닝');
  const f = r.findings.find((x) => x.key === 'whitening');
  assert.ok(f.category && f.why && f.hint);
  assert.ok(Array.isArray(f.matched) && f.matched.length >= 1);
});

test('바이어레디: INCI·인증·거래조건·영문', () => {
  const r = auditText('Full INCI list. ISO 22716 certified. MOQ 500, FOB Busan.');
  const map = Object.fromEntries(r.buyerReady.map((b) => [b.item, b.present]));
  assert.equal(map['INCI 전성분'], true);
  assert.equal(map['인증'], true);
  assert.equal(map['거래조건(MOQ·Incoterms)'], true);
  assert.equal(map['영문 자료'], true);
});

test('깨끗한 문구는 flaggedCount 0', () => {
  const r = auditText('가볍게 발리는 데일리 모이스처라이저입니다.');
  assert.equal(r.summary.flaggedCount, 0);
});

test('빈 입력 안전', () => {
  const r = auditText('');
  assert.equal(r.summary.flaggedCount, 0);
  assert.equal(r.summary.checkedChars, 0);
});

test('20000자 상한', () => {
  const r = auditText('가'.repeat(25000));
  assert.equal(r.summary.checkedChars, 20000);
});

test('면책 문구 항상 포함 + 단정 표현 없음', () => {
  const r = auditText('미백');
  assert.equal(r.disclaimer, DISCLAIMER);
  assert.ok(/법률 자문/.test(r.disclaimer));
  // 규칙 텍스트에 단정 표현이 없어야 함
  const blob = JSON.stringify(require('../src/constants/catalogAuditRules.js'));
  assert.ok(!/금지|위반|불법/.test(blob));
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd backend && node --test tests/catalog-audit.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: 구현**

Create `backend/src/constants/catalogAuditRules.js`:

```js
// 카탈로그 컴플라이언스 예비 점검 규칙 (모듈 2a)
//
// ⚠️ 법적 원칙: 여기 문구는 "업계에서 자주 지적되는 표현"에 대한 일반 교육 정보다.
//    "금지/위반/불법" 같은 단정 표현을 절대 쓰지 않는다. 판단은 전문가가 한다.
//    나중에 Claude 로 설명을 personalize 할 때도 이 톤을 유지한다.

const CLAIM_RULES = [
  { key: 'medicinal', category: '의약품·치료 뉘앙스',
    terms: ['치료', '치유', '여드름 치료', '염증', '항염', '재생', '콜라겐 생성', '상처', '흉터',
      'cure', 'cures', 'heal', 'heals', 'treats', 'treatment', 'anti-inflammatory', 'wound'],
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
    why: 'EU는 이미 동물실험이 금지되어 있어, 이를 차별점처럼 강조하면 오해를 살 소지가 있습니다.',
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
      findings.push({ key: rule.key, category: rule.category, matched, why: rule.why, hint: rule.hint });
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
```

- [ ] **Step 4: 통과 확인**

Run: `cd backend && node --test tests/catalog-audit.test.mjs`
Expected: PASS (8 tests)

- [ ] **Step 5: package.json 스크립트**

`backend/package.json` scripts에 추가:

```json
    "test:catalog": "node --test tests/catalog-audit.test.mjs",
    "smoke:catalog": "node tests/catalog-audit.smoke.mjs"
```

- [ ] **Step 6: 커밋**

```bash
cd backend && git add src/constants/catalogAuditRules.js tests/catalog-audit.test.mjs package.json
git commit -m "feat: add catalog compliance audit rules + auditText"
```

---

### Task 2: 회원 API — POST /me/catalog-audit

**Files:**
- Modify: `backend/src/services/member.service.js` (helper `getLatestDiagnosisId` + export)
- Modify: `backend/src/controllers/member.controller.js` (핸들러 + require + export)
- Modify: `backend/src/routes/member.routes.js` (라우트 1개)
- Create: `backend/tests/catalog-audit.smoke.mjs`

**Interfaces:**
- Consumes: `catalogAuditRules.auditText`, `memberService.getLatestDiagnosisId`, `requireMember`, `ApiError`
- Produces (HTTP): `POST /api/members/me/catalog-audit` body `{ text }` → `{ success, data: { findings, buyerReady, summary, disclaimer, diagnosisId } }`

- [ ] **Step 1: 실패 smoke 작성**

Create `backend/tests/catalog-audit.smoke.mjs`:

```js
// 카탈로그 점검 엔드투엔드 smoke: `npm run smoke:catalog`
const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
let pass = 0, fail = 0;
function check(n, c, e = '') { if (c) { pass++; console.log(`  ✅ ${n}`); } else { fail++; console.log(`  ❌ ${n} ${e}`); } }
async function json(method, path, body, token) {
  const h = {}; if (body) h['Content-Type'] = 'application/json'; if (token) h.Authorization = 'Bearer ' + token;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}
async function run() {
  console.log(`\n▶ Catalog-audit smoke against ${BASE}\n`);
  const stamp = Date.now();
  const reg = await json('POST', '/api/members', { name: '점검', companyName: '점검코스메틱', email: `catalog+${stamp}@test.com`, phone: '010-0000-0000', password: 'catalogpass1' });
  check('회원가입 → 201', reg.status === 201 && !!reg.data.data.token, `(${reg.status})`);
  const token = reg.data?.data?.token;

  const noAuth = await json('POST', '/api/members/me/catalog-audit', { text: '미백' });
  check('토큰 없음 → 401', noAuth.status === 401, `(${noAuth.status})`);

  const empty = await json('POST', '/api/members/me/catalog-audit', { text: '   ' }, token);
  check('빈 문구 → 400', empty.status === 400, `(${empty.status})`);

  const res = await json('POST', '/api/members/me/catalog-audit', { text: '이 제품은 미백과 여드름 치료에 좋습니다. INCI 제공.' }, token);
  check('점검 → 200', res.status === 200, `(${res.status})`);
  const keys = (res.data.data?.findings || []).map((f) => f.key);
  check('미백 감지', keys.includes('whitening'));
  check('치료 감지', keys.includes('medicinal'));
  check('INCI 바이어레디 present', (res.data.data?.buyerReady || []).some((b) => b.item === 'INCI 전성분' && b.present));
  check('면책 문구 포함', /법률 자문/.test(res.data.data?.disclaimer || ''));
  check('diagnosisId 키 존재(null 가능)', res.data.data && 'diagnosisId' in res.data.data);

  console.log(`\n── Result: ${pass} passed, ${fail} failed ──\n`);
  process.exit(fail === 0 ? 0 : 1);
}
run().catch((e) => { console.error('crashed:', e); process.exit(1); });
```

- [ ] **Step 2: 실패 확인**

Run (서버 구동): `cd backend && npm run smoke:catalog`
Expected: FAIL — endpoint 404.

- [ ] **Step 3: member.service 헬퍼 추가**

`backend/src/services/member.service.js` 의 `module.exports` 바로 앞에 추가:

```js
// 회원 최신 진단 id (없으면 null) — 카탈로그 점검 결과의 상담 CTA용
async function getLatestDiagnosisId(memberId) {
  const latest = await prisma.exportDiagnosisRequest.findFirst({
    where: { memberId },
    orderBy: { submittedAt: 'desc' },
    select: { id: true },
  });
  return latest ? latest.id : null;
}
```

`module.exports` 객체에 `getLatestDiagnosisId` 추가.

- [ ] **Step 4: 컨트롤러 핸들러 추가**

`backend/src/controllers/member.controller.js` 상단 require에 추가:

```js
const catalogAuditRules = require('../constants/catalogAuditRules');
```

`module.exports` 앞에 핸들러 추가:

```js
// POST /api/members/me/catalog-audit — 카탈로그 문구 컴플라이언스 예비 점검 (회원)
async function catalogAudit(req, res, next) {
  try {
    const text = req.body && req.body.text;
    if (!text || !String(text).trim()) throw new ApiError(400, '점검할 문구를 입력해주세요.');
    const audit = catalogAuditRules.auditText(text);
    const diagnosisId = await memberService.getLatestDiagnosisId(req.member.id);
    return res.json({ success: true, data: { ...audit, diagnosisId } });
  } catch (err) {
    next(err);
  }
}
```

`module.exports` 에 `catalogAudit` 추가.

- [ ] **Step 5: 라우트 추가**

`backend/src/routes/member.routes.js` "회원 본인" 구간에 추가:

```js
router.post('/me/catalog-audit', requireMember, ctrl.catalogAudit); // 카탈로그 컴플라이언스 점검
```

- [ ] **Step 6: 통과 확인**

Run (서버 구동, watch 자동 리로드 대기 ~2s): `cd backend && npm run smoke:catalog`
Expected: PASS (`0 failed`, 9 checks)

- [ ] **Step 7: 커밋**

```bash
cd backend && git add src/services/member.service.js src/controllers/member.controller.js src/routes/member.routes.js tests/catalog-audit.smoke.mjs
git commit -m "feat: add member catalog-audit endpoint"
```

---

### Task 3: 프론트 — catalog.html 도구

**Files:**
- Create: `catalog.html`

**Interfaces:**
- Consumes (HTTP): `POST /api/members/me/catalog-audit`, `POST /api/export-diagnosis/:id/request-consultation`

- [ ] **Step 1: catalog.html 생성**

Create `catalog.html` (email.html의 구조·토큰 처리 관례를 따름):

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>카탈로그 EU 점검 — BridgeX</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
  :root { --blue:#0066cc; --blue-focus:#0071e3; --ink:#1d1d1f; --muted:#6e6e73; --parchment:#f5f5f7; --white:#fff; --hairline:#e0e0e0; --shadow:0 2px 20px rgba(0,0,0,0.06); }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--parchment);color:var(--ink);font-family:'Inter','Noto Sans KR',sans-serif;-webkit-font-smoothing:antialiased;word-break:keep-all;}
  a{color:inherit;text-decoration:none;} h1,h2,h3,p{margin:0;}
  nav{position:sticky;top:0;z-index:40;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(20px,5vw,40px);background:rgba(250,248,244,0.9);backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid rgba(0,0,0,0.07);}
  .logo{font-size:20px;font-weight:800;letter-spacing:-0.5px;} .logo span{color:var(--blue);}
  .nav-right{display:flex;gap:18px;align-items:center;}
  .nav-link{font-size:14px;font-weight:600;color:var(--muted);cursor:pointer;background:none;border:none;font-family:inherit;}
  .nav-link:hover{color:var(--ink);}
  .wrap{max-width:760px;margin:0 auto;padding:clamp(24px,5vw,44px) clamp(16px,4vw,24px) 80px;}
  .head h1{font-size:clamp(24px,4vw,32px);font-weight:800;letter-spacing:-0.6px;}
  .head p{font-size:15px;color:var(--muted);margin-top:8px;}
  .card{background:var(--white);border-radius:18px;box-shadow:var(--shadow);padding:clamp(22px,4vw,30px);margin-top:22px;}
  .card h2{font-size:15px;font-weight:800;margin:0 0 4px;}
  .card .ch-sub{font-size:13px;color:var(--muted);margin-bottom:16px;}
  textarea{width:100%;min-height:220px;font-family:inherit;font-size:14px;line-height:1.6;border:1px solid var(--hairline);border-radius:11px;padding:14px;outline:none;resize:vertical;}
  textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,102,204,0.12);}
  .btn{height:50px;padding:0 26px;border-radius:999px;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;border:none;transition:transform .15s,box-shadow .15s;}
  .btn-primary{background:var(--blue-focus);color:#fff;box-shadow:0 6px 20px rgba(0,102,204,0.28);width:100%;margin-top:14px;}
  .btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,102,204,0.36);}
  .btn-primary:disabled{opacity:.5;cursor:default;}
  .disclaimer{font-size:12px;color:var(--muted);line-height:1.6;background:rgba(0,0,0,0.035);border:1px solid var(--hairline);border-radius:10px;padding:12px 14px;margin-top:14px;}
  .finding{border:1px solid var(--hairline);border-radius:12px;padding:14px 16px;margin-bottom:10px;}
  .finding .fc{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;}
  .fbadge{font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(214,158,46,0.18);color:#a9741a;}
  .fcat{font-size:14px;font-weight:800;}
  .fmatch{font-size:12.5px;color:var(--muted);}
  .fmatch b{color:var(--ink);background:rgba(214,158,46,0.16);padding:1px 6px;border-radius:5px;font-weight:700;}
  .fwhy{font-size:13px;line-height:1.55;margin-top:4px;}
  .fhint{font-size:12.5px;color:#1e7a50;margin-top:6px;}
  .br-row{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(0,0,0,0.05);font-size:13px;}
  .br-row:last-child{border-bottom:none;}
  .br-ic{flex:0 0 auto;font-size:14px;}
  .br-item{font-weight:700;flex:0 0 40%;}
  .br-note{color:var(--muted);flex:1;}
  .clean{font-size:14px;color:#1e7a50;font-weight:600;background:rgba(46,158,107,0.1);border-radius:10px;padding:12px 14px;}
  .wall{background:rgba(224,120,60,0.08);border:1px solid rgba(224,120,60,0.25);border-radius:14px;padding:18px;margin-top:18px;}
  .wall h3{font-size:15px;font-weight:800;color:#c05a1e;margin-bottom:6px;}
  .wall p{font-size:13px;color:var(--ink);line-height:1.6;margin-bottom:12px;}
  .loading{text-align:center;padding:60px 0;color:var(--muted);font-size:14px;}
</style>
</head>
<body>
  <nav>
    <a href="mypage.html" class="logo">Bridge<span>X</span></a>
    <div class="nav-right"><a href="mypage.html" class="nav-link">내 페이지</a><button class="nav-link" id="logout">로그아웃</button></div>
  </nav>

  <div class="wrap">
    <div class="loading" id="loading">불러오는 중…</div>
    <div id="app" style="display:none;">
      <div class="head">
        <h1>카탈로그 EU 점검</h1>
        <p>카탈로그·상세페이지의 <b>제품 설명·문구</b>를 붙여넣으면, EU 시장에서 <b>자주 지적되는 표현</b>을 짚어드립니다.</p>
      </div>

      <div class="card">
        <h2>1. 점검할 문구 붙여넣기</h2>
        <div class="ch-sub">영문·국문 모두 가능합니다. 제품 설명, 효능 문구, 마케팅 카피를 붙여넣으세요.</div>
        <textarea id="text" placeholder="예: 이 제품은 미백과 주름 개선에 효과적이며, 여드름 치료를 도와줍니다…"></textarea>
        <div class="disclaimer" id="disc0">본 점검은 공개된 EU 화장품 가이드라인 기반 <b>일반 교육 정보</b>이며, 법률 자문이나 공식 규제 판단이 아닙니다. 최종 확정 전 반드시 전문 규제 컨설턴트와 상의하세요.</div>
        <button class="btn btn-primary" id="runBtn">EU 관점으로 점검하기 →</button>
      </div>

      <div class="card" id="resultCard" style="display:none;">
        <h2>2. 점검 결과</h2>
        <div class="ch-sub" id="resultSub"></div>
        <div id="findings"></div>
        <h2 style="margin-top:22px;">바이어레디 체크</h2>
        <div class="ch-sub">EU B2B 자료에 흔히 필요한 요소가 문구에 보이는지 확인합니다. (신호 기반 추정)</div>
        <div id="buyerReady"></div>
        <div class="disclaimer" id="discResult"></div>
        <div class="wall" id="wall">
          <h3>정확한 판단은 전문가와.</h3>
          <p>이 점검은 예비 참고용입니다. 실제 표현 수정·규제 적합성은 대표님 브랜드에 맞춘 전문가 검토가 필요합니다.</p>
          <button class="btn btn-primary" id="consultBtn" style="margin-top:0;">전문가에게 카탈로그 검토 요청 →</button>
        </div>
      </div>
    </div>
  </div>

<script>
  var API_BASE = (location.protocol === 'file:' || ['localhost','127.0.0.1'].includes(location.hostname)) ? 'http://localhost:4000' : '';
  var TOKEN_KEY = 'bridgex_member_token';
  var token = null; try { token = localStorage.getItem(TOKEN_KEY); } catch(e){}
  var lastDiagnosisId = null;
  var $ = function(id){ return document.getElementById(id); };
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function logout(){ try{localStorage.removeItem(TOKEN_KEY);}catch(e){} location.href='index.html'; }
  $('logout').addEventListener('click', logout);

  if(!token){ location.href='index.html'; }
  else { $('loading').style.display='none'; $('app').style.display='block'; }

  $('runBtn').addEventListener('click', async function(){
    var text = $('text').value.trim();
    if(!text){ $('text').focus(); return; }
    var btn=$('runBtn'); btn.disabled=true; btn.textContent='점검 중…';
    try{
      var res = await fetch(API_BASE+'/api/members/me/catalog-audit', { method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}, body:JSON.stringify({text:text}) });
      if(res.status===401){ logout(); return; }
      var j = await res.json();
      if(!res.ok || !j.success) throw new Error(j.message||'점검에 실패했습니다.');
      render(j.data);
    }catch(e){ alert(e.message); }
    finally{ btn.disabled=false; btn.textContent='EU 관점으로 점검하기 →'; }
  });

  function render(d){
    lastDiagnosisId = d.diagnosisId || null;
    var n = d.summary.flaggedCount;
    $('resultSub').textContent = n>0 ? ('검토를 권장하는 표현 ' + n + '개를 찾았습니다.') : '눈에 띄는 위험 표현은 발견되지 않았습니다.';
    if(n>0){
      $('findings').innerHTML = d.findings.map(function(f){
        var matched = f.matched.map(function(m){ return '<b>'+esc(m)+'</b>'; }).join(' ');
        return '<div class="finding"><div class="fc"><span class="fbadge">검토 권장</span><span class="fcat">'+esc(f.category)+'</span></div>'
          + '<div class="fmatch">발견: '+matched+'</div>'
          + '<div class="fwhy">'+esc(f.why)+'</div>'
          + '<div class="fhint">💡 '+esc(f.hint)+'</div></div>';
      }).join('');
    } else {
      $('findings').innerHTML = '<div class="clean">✓ 자주 지적되는 표현은 발견되지 않았습니다. 다만 이는 예비 점검이며, 정확한 판단은 전문가 확인이 필요합니다.</div>';
    }
    $('buyerReady').innerHTML = d.buyerReady.map(function(b){
      return '<div class="br-row"><span class="br-ic">'+(b.present?'✅':'⬜')+'</span><span class="br-item">'+esc(b.item)+'</span>'
        + '<span class="br-note">'+(b.present?'문구에서 확인됨':esc(b.note))+'</span></div>';
    }).join('');
    $('discResult').textContent = d.disclaimer;
    $('resultCard').style.display='block';
    $('resultCard').scrollIntoView({behavior:'smooth', block:'start'});
  }

  $('consultBtn').addEventListener('click', async function(){
    if(!lastDiagnosisId){
      if(confirm('상담 요청을 위해 먼저 수출 진단이 필요합니다. 진단 페이지로 이동할까요?')) location.href='diagnose.html';
      return;
    }
    if(!confirm('전문가에게 카탈로그 컴플라이언스 검토를 요청할까요?')) return;
    var btn=$('consultBtn'); btn.disabled=true; btn.textContent='신청 중…';
    try{
      var res = await fetch(API_BASE+'/api/export-diagnosis/'+lastDiagnosisId+'/request-consultation', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({stepContext:'카탈로그 컴플라이언스 검토'}) });
      var j = await res.json();
      if(!res.ok || !j.success) throw new Error(j.message||'신청 실패');
      alert('상담 신청이 접수되었습니다. 담당 전문가가 곧 연락드립니다.');
      btn.textContent='신청 완료 ✓';
    }catch(e){ alert(e.message); btn.disabled=false; btn.textContent='전문가에게 카탈로그 검토 요청 →'; }
  });
</script>
</body>
</html>
```

- [ ] **Step 2: 브라우저 검증 (컨트롤러가 수행)**

정적 서버(4599)+백엔드(4000) 구동, 로그인 회원으로 `catalog.html` 확인:
- 문구 붙여넣기 → 점검 → 미백/치료 등 발견 카드(검토 권장 배지·category·매칭·why·hint) 표시.
- 바이어레디 체크(INCI/인증/거래조건/영문) present 아이콘.
- 면책 문구 입력 전/결과 모두 노출.
- 벽 CTA: 진단 있는 회원 → 상담 접수, 없는 회원 → 진단 유도.
- 단정 표현("금지/위반/불법") 화면에 없음.

- [ ] **Step 3: 커밋**

```bash
git add catalog.html
git commit -m "feat: add catalog EU compliance audit tool page"
```

---

### Task 4: 연결 — 로드맵 링크 + 마이페이지 버튼

**Files:**
- Modify: `backend/src/services/roadmap.service.js` (`catalog_audit` step link)
- Modify: `mypage.html` ("AI 실무 도구" 카드)

**Interfaces:**
- `catalog_audit` step의 `link` 가 `{ type:'tool', href:'catalog.html' }` 가 되어 프론트가 "도구 열기 →" 로 렌더(기존 tool 분기 재사용).

- [ ] **Step 1: 로드맵 링크 변경**

`backend/src/services/roadmap.service.js` 의 `catalog_audit` STEP_DEF에서 `link` 를 변경:

```js
  { id: 'catalog_audit', phase: 'sales', title: '기존 카탈로그 업로드·바이어레디 진단', tag: 'hybrid',
    link: { type: 'tool', href: 'catalog.html' }, showIf: (c) => c.hasBrochure, done: () => false,
    comment: '한국 카탈로그엔 EU에서 자주 지적되는 표현(미백·효능 등)이 있을 수 있습니다. 문구를 붙여넣으면 예비 점검해 드립니다.' },
```

(`catalog_generate`(생성기, 2b)는 `{ type:'soon' }` 유지.)

- [ ] **Step 2: 로드맵 단위 테스트 회귀 확인**

Run: `cd backend && node --test tests/roadmap.test.mjs`
Expected: PASS (기존 7 tests — link 변경은 단계 수·done 로직에 영향 없음)

- [ ] **Step 3: 마이페이지 도구 버튼 추가**

`mypage.html` "AI 실무 도구" 카드에서, 기존 이메일 도구 버튼 뒤에 카탈로그 버튼을 추가한다. 아래 블록을 찾아:

```html
        <a href="email.html" class="btn btn-primary" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">✉️ AI 이메일 작성 도구 열기</a>
```

다음으로 교체:

```html
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <a href="email.html" class="btn btn-primary" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;flex:1;min-width:200px;">✉️ AI 이메일 작성 도구</a>
          <a href="catalog.html" class="btn btn-primary" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;flex:1;min-width:200px;background:#fff;color:var(--blue);border:1px solid var(--hairline);box-shadow:none;">🧴 카탈로그 EU 점검</a>
        </div>
```

- [ ] **Step 4: 브라우저 검증 (컨트롤러 수행)**

- 마이페이지 도구 카드에 "🧴 카탈로그 EU 점검" 버튼 노출 → catalog.html 이동.
- 브로셔 보유 회원의 로드맵 `기존 카탈로그 업로드·바이어레디 진단` 단계에 "도구 열기 →" 노출 → catalog.html 이동.

- [ ] **Step 5: 커밋**

```bash
cd backend && git add src/services/roadmap.service.js && cd .. && git add mypage.html
git commit -m "feat: link catalog audit tool from roadmap step and mypage"
```

---

## Self-Review

**Spec coverage:** 규칙 스캔(T1) · API+최신진단id(T2) · 도구 페이지+면책+벽 CTA(T3) · 로드맵/마이페이지 연결(T4). 저장 없음(v1) 준수. ✓
**법적 제약:** 규칙/문구에 "금지/위반/불법" 없음(T1 테스트가 강제) · 결과 면책 상시(T1 disclaimer, T3 disc0/discResult) · 판단 전문가 이관(벽 CTA). ✓
**Placeholder scan:** 모든 스텝 실제 코드/명령/기대출력 포함. ✓
**Type consistency:** `auditText` 반환 `{findings, buyerReady, summary{flaggedCount,checkedChars}, disclaimer}` — T2 응답(+diagnosisId), T3 render 동일 필드명. `link{type,href}` T4 ↔ 기존 mypage tool 분기 일치. ✓
