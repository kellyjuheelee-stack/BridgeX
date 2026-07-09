# 수출 실행 로드맵 (모듈 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 진단 데이터를 마이페이지에 상주하는 16단계 "수출 실행 로드맵"으로 변환하고, 각 단계를 셀프체크·도구연결·컨설팅연결한다.

**Architecture:** 규칙 기반 순수 함수(`roadmap.service.js`)가 진단 1건 + 회원 진행상태 JSON을 받아 16단계 배열과 진행률을 산출한다. 진행상태는 `Member.roadmapProgress`(JSON 문자열)에 저장한다. 회원 API 2개(조회·토글)와 기존 상담신청 API 확장(단계 맥락), `mypage.html`에 로드맵 카드를 추가한다. 생성 로직은 한 함수(`buildRoadmap`)에 격리해 나중에 Claude 코멘트로 교체 가능하게 둔다.

**Tech Stack:** Node 18+ (내장 fetch/test runner), Express 4, Prisma 5 + SQLite, 정적 HTML(바닐라 JS). 신규 의존성 없음.

## Global Constraints

- SQLite는 배열/객체를 네이티브로 저장 못 함 → JSON은 문자열로 저장/파싱. 기존 `src/utils/serialize.js` 패턴을 따르되, `Member.roadmapProgress`는 단일 신규 필드이므로 해당 서비스에서 `JSON.parse`/`JSON.stringify`로 직접 처리한다.
- 진단 응답/조회는 항상 `deserializeFromDb`로 파싱한 객체를 쓴다(배열 필드가 문자열이 아니라 배열이어야 함).
- 로드맵 단계 수는 항상 16 (9번 `catalog_generate`와 9b번 `catalog_audit`는 브로셔 유무로 **택일** 노출).
- 코멘트는 규칙 기반 문자열(초기). Claude 교체 지점은 `buildRoadmap` 내부의 `comment()` 뿐이다.
- 회원 인증은 기존 `requireMember` 미들웨어 사용, `req.member.id`로 회원 식별.
- 테스트: 순수 로직은 Node 내장 `node --test`(신규 의존성 없음), 엔드투엔드는 서버 구동 후 smoke 스크립트.
- 커밋 메시지는 한국어/영문 혼용 기존 관례(`feat:` 프리픽스) 따름. 이 저장소는 아직 git 저장소가 아닐 수 있음 → 첫 커밋 전 `git init` 필요 시 실행.

---

### Task 1: roadmap.service.js — 16단계 산출 순수 로직

**Files:**
- Create: `backend/src/services/roadmap.service.js`
- Test: `backend/tests/roadmap.test.mjs`
- Modify: `backend/package.json` (scripts에 `test:roadmap` 추가)

**Interfaces:**
- Produces:
  - `buildRoadmap(diagnosis, progress) → { steps: Step[], progress: { total, doneCount, expertRemaining, percent } }`
    - `diagnosis`: `deserializeFromDb`된 진단 객체(없으면 `null`/`{}`).
    - `progress`: `{ [stepId]: { done: boolean, doneAt: string|null } }` (없으면 `{}`).
    - `Step`: `{ id, phase, title, tag, link, derivedDone, done, comment }`
      - `tag`: `'self' | 'expert' | 'hybrid'`
      - `link`: `{ type: 'info'|'tool'|'consulting'|'soon', href?: string, label?: string }`
  - `isValidStepId(stepId) → boolean`
  - `STEP_IDS: string[]`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `backend/tests/roadmap.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const roadmap = require('../src/services/roadmap.service.js');

// 브로셔 없음 + EU 준비 일부 보유 회원
const diagBrochureless = {
  isSellingInKorea: '판매 중',
  certifications: ['ISO 22716', '비건 인증'],
  euComplianceReadiness: ['CPNP 사전 등록', '제품정보파일(PIF) 구비'],
  packagingReadiness: [],
  productFiles: [],
};

test('16단계 반환, 택일 단계는 하나만', () => {
  const { steps, progress } = roadmap.buildRoadmap(diagBrochureless, {});
  assert.equal(steps.length, 16);
  assert.equal(progress.total, 16);
  const ids = steps.map((s) => s.id);
  // 브로셔 없음 → catalog_generate 노출, catalog_audit 미노출
  assert.ok(ids.includes('catalog_generate'));
  assert.ok(!ids.includes('catalog_audit'));
});

test('진단 데이터로 done 파생', () => {
  const { steps } = roadmap.buildRoadmap(diagBrochureless, {});
  const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
  assert.equal(byId.eu_cpnp.done, true); // euComplianceReadiness에 포함
  assert.equal(byId.eu_pif.done, true);
  assert.equal(byId.eu_rp.done, false); // 미포함
  assert.equal(byId.domestic_proof.done, true); // 판매중 + 실인증
});

test('브로셔 있으면 catalog_audit 택일', () => {
  const { steps } = roadmap.buildRoadmap(
    { ...diagBrochureless, productFiles: [{ fileName: 'a.pdf' }] },
    {}
  );
  const ids = steps.map((s) => s.id);
  assert.ok(ids.includes('catalog_audit'));
  assert.ok(!ids.includes('catalog_generate'));
});

test('회원 진행상태가 파생값을 override', () => {
  const { steps, progress } = roadmap.buildRoadmap(diagBrochureless, {
    eu_rp: { done: true, doneAt: '2026-07-09T00:00:00.000Z' },
  });
  const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
  assert.equal(byId.eu_rp.done, true);
  assert.equal(byId.eu_rp.derivedDone, false); // 파생은 여전히 false
  assert.ok(progress.doneCount >= 4);
});

test('expertRemaining은 미완료 expert/hybrid 수', () => {
  const { steps, progress } = roadmap.buildRoadmap(diagBrochureless, {});
  const manual = steps.filter(
    (s) => (s.tag === 'expert' || s.tag === 'hybrid') && !s.done
  ).length;
  assert.equal(progress.expertRemaining, manual);
  assert.ok(progress.expertRemaining > 0);
});

test('빈 진단도 안전하게 16단계', () => {
  const { steps } = roadmap.buildRoadmap(null, {});
  assert.equal(steps.length, 16);
});

test('isValidStepId', () => {
  assert.equal(roadmap.isValidStepId('eu_cpnp'), true);
  assert.equal(roadmap.isValidStepId('nope'), false);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd backend && node --test tests/roadmap.test.mjs`
Expected: FAIL — `Cannot find module '../src/services/roadmap.service.js'`

- [ ] **Step 3: 서비스 구현**

Create `backend/src/services/roadmap.service.js`:

```js
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd backend && node --test tests/roadmap.test.mjs`
Expected: PASS (7 tests)

- [ ] **Step 5: package.json 스크립트 추가**

`backend/package.json`의 `scripts`에 추가:

```json
    "smoke": "node tests/smoke.mjs",
    "test:roadmap": "node --test tests/roadmap.test.mjs",
    "smoke:roadmap": "node tests/roadmap.smoke.mjs"
```

- [ ] **Step 6: 커밋**

```bash
cd backend && git add src/services/roadmap.service.js tests/roadmap.test.mjs package.json
git commit -m "feat: add roadmap.service with 16-step export roadmap logic"
```

---

### Task 2: 진행상태 저장 — Member.roadmapProgress + member.service

**Files:**
- Modify: `backend/prisma/schema.prisma:87-101` (Member 모델에 필드 추가)
- Modify: `backend/src/services/member.service.js` (함수 2개 + export)

**Interfaces:**
- Consumes: `roadmap.service.buildRoadmap`, `roadmap.service.isValidStepId`, `deserializeFromDb`
- Produces:
  - `getRoadmap(memberId) → { hasDiagnosis, diagnosisId?, steps, progress }`
  - `toggleRoadmapStep(memberId, stepId, done) → (getRoadmap 결과)` — `stepId` 유효성은 호출 측(컨트롤러)에서 검증

- [ ] **Step 1: Prisma 스키마에 필드 추가**

`backend/prisma/schema.prisma` Member 모델(현재 87–101행)에 `roadmapProgress` 추가:

```prisma
model Member {
  id           String   @id @default(cuid())
  name         String
  companyName  String
  email        String   @unique
  phone        String
  passwordHash String
  createdAt    DateTime @default(now())
  lastLoginAt  DateTime?
  roadmapProgress String? // JSON: { "<stepId>": { "done": bool, "doneAt": iso } }

  diagnoses ExportDiagnosisRequest[]

  @@index([createdAt])
  @@map("members")
}
```

- [ ] **Step 2: 마이그레이션 실행**

Run: `cd backend && npx prisma migrate dev --name add_roadmap_progress`
Expected: 새 마이그레이션 생성 + `members` 테이블에 `roadmapProgress` 컬럼 추가, `prisma generate` 자동 실행.

- [ ] **Step 3: member.service에 함수 추가**

`backend/src/services/member.service.js` 상단 require 아래에 roadmap 서비스 추가:

```js
const roadmapService = require('./roadmap.service');
```

파일 하단 `module.exports` 바로 위에 함수 추가:

```js
function parseProgress(raw) {
  if (!raw || typeof raw !== 'string') return {};
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

// 회원의 최신 진단 기반 로드맵 + 진행률
async function getRoadmap(memberId) {
  const latest = await prisma.exportDiagnosisRequest.findFirst({
    where: { memberId },
    orderBy: { submittedAt: 'desc' },
  });
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { roadmapProgress: true },
  });
  const progress = parseProgress(member && member.roadmapProgress);

  if (!latest) {
    return { hasDiagnosis: false, steps: [], progress: { total: 0, doneCount: 0, expertRemaining: 0, percent: 0 } };
  }
  const d = deserializeFromDb(latest);
  const built = roadmapService.buildRoadmap(d, progress);
  return { hasDiagnosis: true, diagnosisId: d.id, steps: built.steps, progress: built.progress };
}

// 단계 완료/해제 토글 후 갱신된 로드맵 반환
async function toggleRoadmapStep(memberId, stepId, done) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { roadmapProgress: true },
  });
  const progress = parseProgress(member && member.roadmapProgress);
  progress[stepId] = { done: !!done, doneAt: done ? new Date().toISOString() : null };
  await prisma.member.update({
    where: { id: memberId },
    data: { roadmapProgress: JSON.stringify(progress) },
  });
  return getRoadmap(memberId);
}
```

`module.exports` 객체에 두 함수 추가:

```js
module.exports = {
  createMember,
  findByEmailWithHash,
  verifyPassword,
  touchLastLogin,
  getPublicById,
  listMembers,
  listMyDiagnoses,
  getEmailContext,
  getRoadmap,
  toggleRoadmapStep,
};
```

- [ ] **Step 4: 서버 부팅 확인 (구문·연결 검증)**

Run: `cd backend && node -e "require('./src/services/member.service'); console.log('ok')"`
Expected: `ok` 출력 (require 에러 없음).

- [ ] **Step 5: 커밋**

```bash
cd backend && git add prisma/schema.prisma prisma/migrations src/services/member.service.js
git commit -m "feat: persist roadmap progress on Member + getRoadmap/toggle"
```

---

### Task 3: 회원 API — 로드맵 조회·토글

**Files:**
- Modify: `backend/src/controllers/member.controller.js` (핸들러 2개 + require + export)
- Modify: `backend/src/routes/member.routes.js` (라우트 2개)
- Create: `backend/tests/roadmap.smoke.mjs`

**Interfaces:**
- Consumes: `memberService.getRoadmap`, `memberService.toggleRoadmapStep`, `roadmapService.isValidStepId`, `requireMember`, `ApiError`
- Produces (HTTP):
  - `GET /api/members/me/roadmap` → `{ success, data: { hasDiagnosis, diagnosisId?, steps, progress } }`
  - `POST /api/members/me/roadmap/steps/:stepId/toggle` body `{ done?: boolean }` (기본 true) → `{ success, data: <roadmap> }`

- [ ] **Step 1: 실패하는 smoke 테스트 작성**

Create `backend/tests/roadmap.smoke.mjs`:

```js
// 로드맵 엔드투엔드 smoke. 서버 구동 상태에서 실행: `npm run smoke:roadmap`
const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
async function json(method, path, body, token) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const stamp = Date.now();
const memberPayload = {
  name: '로드맵테스트',
  companyName: '로드맵코스메틱',
  email: `roadmap+${stamp}@test.com`,
  phone: '010-0000-0000',
  password: 'roadmappass1',
};
const diagPayload = {
  contactName: '로드맵테스트', companyName: '로드맵코스메틱', email: memberPayload.email, phone: '010-0000-0000',
  productName: 'Test Cream', productCategory: '스킨케어', hasInci: 'INCI 리스트 보유',
  isSellingInKorea: '판매 중', certifications: ['ISO 22716'],
  euComplianceReadiness: ['CPNP 사전 등록', '제품정보파일(PIF) 구비'],
  packagingReadiness: [], targetCountries: ['France'],
  exportExperience: '없음', hasExistingBuyer: '없음', painPoints: ['유럽 규제/허가가 어렵습니다'],
};

async function run() {
  console.log(`\n▶ Roadmap smoke against ${BASE}\n`);

  const reg = await json('POST', '/api/members', memberPayload);
  check('회원가입 → 201 + token', reg.status === 201 && !!reg.data.data.token, `(got ${reg.status})`);
  const token = reg.data?.data?.token;

  const noDiag = await json('GET', '/api/members/me/roadmap', null, token);
  check('진단 전 → hasDiagnosis:false', noDiag.status === 200 && noDiag.data.data.hasDiagnosis === false);

  const diag = await json('POST', '/api/export-diagnosis', diagPayload, token);
  check('진단 제출(회원연결) → 201', diag.status === 201, `(got ${diag.status})`);

  const rm = await json('GET', '/api/members/me/roadmap', null, token);
  check('로드맵 → 16단계', rm.status === 200 && rm.data.data.steps.length === 16, `(got ${rm.data?.data?.steps?.length})`);
  check('diagnosisId 포함', !!rm.data.data.diagnosisId);
  const byId = Object.fromEntries((rm.data.data.steps || []).map((s) => [s.id, s]));
  check('eu_cpnp done 파생', byId.eu_cpnp && byId.eu_cpnp.done === true);
  check('eu_rp 미완료', byId.eu_rp && byId.eu_rp.done === false);
  check('expertRemaining > 0', rm.data.data.progress.expertRemaining > 0);
  const before = rm.data.data.progress.doneCount;

  const tog = await json('POST', '/api/members/me/roadmap/steps/eu_rp/toggle', { done: true }, token);
  check('토글 → doneCount +1', tog.status === 200 && tog.data.data.progress.doneCount === before + 1, `(got ${tog.data?.data?.progress?.doneCount})`);

  const bad = await json('POST', '/api/members/me/roadmap/steps/nope/toggle', { done: true }, token);
  check('잘못된 stepId → 400', bad.status === 400, `(got ${bad.status})`);

  const noauth = await json('GET', '/api/members/me/roadmap');
  check('토큰 없음 → 401', noauth.status === 401, `(got ${noauth.status})`);

  console.log(`\n── Result: ${pass} passed, ${fail} failed ──\n`);
  process.exit(fail === 0 ? 0 : 1);
}
run().catch((e) => { console.error('crashed:', e); process.exit(1); });
```

- [ ] **Step 2: 테스트 실패 확인**

Run (서버 구동 후 별도 셸): `cd backend && npm run smoke:roadmap`
Expected: FAIL — 로드맵 엔드포인트가 404 (`16단계` 등 실패).

- [ ] **Step 3: 컨트롤러 핸들러 추가**

`backend/src/controllers/member.controller.js` 상단 require에 추가:

```js
const roadmapService = require('../services/roadmap.service');
```

`list` 함수 정의 뒤(파일 하단 `module.exports` 앞)에 추가:

```js
// GET /api/members/me/roadmap — 내 수출 실행 로드맵 (회원)
async function myRoadmap(req, res, next) {
  try {
    const data = await memberService.getRoadmap(req.member.id);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// POST /api/members/me/roadmap/steps/:stepId/toggle — 단계 완료 토글 (회원)
async function toggleRoadmapStep(req, res, next) {
  try {
    const { stepId } = req.params;
    if (!roadmapService.isValidStepId(stepId)) throw new ApiError(400, '유효하지 않은 단계입니다.');
    const done = req.body && req.body.done === false ? false : true; // 기본 true
    const data = await memberService.toggleRoadmapStep(req.member.id, stepId, done);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
```

`module.exports` 를 다음으로 교체:

```js
module.exports = { register, login, me, myDiagnoses, emailTemplateList, generateEmailDraft, list, myRoadmap, toggleRoadmapStep };
```

- [ ] **Step 4: 라우트 추가**

`backend/src/routes/member.routes.js` 의 "회원 본인" 구간(현재 15행 `email-draft` 라우트 아래)에 추가:

```js
router.get('/me/roadmap', requireMember, ctrl.myRoadmap); // 수출 실행 로드맵
router.post('/me/roadmap/steps/:stepId/toggle', requireMember, ctrl.toggleRoadmapStep); // 단계 토글
```

- [ ] **Step 5: 서버 재시작 후 테스트 통과 확인**

Run (서버 구동 상태): `cd backend && npm run smoke:roadmap`
Expected: PASS (11 checks, `0 failed`)

- [ ] **Step 6: 기존 smoke 회귀 확인**

Run: `cd backend && npm run smoke`
Expected: 기존 테스트 그대로 PASS (`0 failed`)

- [ ] **Step 7: 커밋**

```bash
cd backend && git add src/controllers/member.controller.js src/routes/member.routes.js tests/roadmap.smoke.mjs
git commit -m "feat: add member roadmap GET + step toggle endpoints"
```

---

### Task 4: 🔴 단계 → 컨설팅 신청에 단계 맥락 전달

**Files:**
- Modify: `backend/src/services/diagnosis.service.js:174-186` (`requestConsultation`에 stepContext)
- Modify: `backend/src/controllers/diagnosis.controller.js:176-195` (body에서 stepContext 전달)
- Modify: `backend/tests/roadmap.smoke.mjs` (검증 1개 추가)

**Interfaces:**
- Consumes: 기존 `POST /api/export-diagnosis/:id/request-consultation` (공개 라우트)
- Produces: 동일 엔드포인트가 body `{ stepContext?: string }` 를 받아, 전달 시 `adminMemo`에 `[로드맵] '<맥락>' 단계에서 상담 신청` 을 append 한다. 응답 형태는 불변.

- [ ] **Step 1: smoke에 검증 추가**

`backend/tests/roadmap.smoke.mjs` 의 `run()` 안, "잘못된 stepId → 400" 체크 뒤에 추가:

```js
  const consult = await json('POST', `/api/export-diagnosis/${diag.data.data.id}/request-consultation`, { stepContext: 'CPNP 사전 등록' });
  check('단계맥락 상담신청 → consulting_needed', consult.status === 200 && consult.data.data.diagnosisStatus === 'consulting_needed', `(got ${consult.status})`);
```

(`diag.data.data.id` 는 진단 제출 응답의 id. Step 3 smoke에서 이미 `diag` 변수 존재.)

- [ ] **Step 2: 테스트 실패/미검증 확인**

Run (서버 구동): `cd backend && npm run smoke:roadmap`
Expected: 새 체크는 통과할 수도 있으나(기존 로직이 상태는 바꿈), `stepContext`가 `adminMemo`에 반영되지 않음 — 다음 단계에서 서비스가 맥락을 저장하도록 구현한다. (검증 강화를 위해 Step 5에서 상세 조회로 확인)

- [ ] **Step 3: 서비스 수정**

`backend/src/services/diagnosis.service.js` 의 `requestConsultation` 를 다음으로 교체:

```js
// 상담 신청 (훅 → 컨설팅 전환). 상태를 consulting_needed 로 전이.
// stepContext: 로드맵 단계에서 진입 시 그 단계명 (관리자 메모에 기록)
async function requestConsultation(id, stepContext = null) {
  const exists = await prisma.exportDiagnosisRequest.findUnique({
    where: { id },
    select: { id: true, adminMemo: true },
  });
  if (!exists) return null;
  const memoAddition = stepContext ? `[로드맵] '${String(stepContext).trim()}' 단계에서 상담 신청` : null;
  const adminMemo = memoAddition ? [exists.adminMemo, memoAddition].filter(Boolean).join('\n') : undefined;
  return prisma.exportDiagnosisRequest.update({
    where: { id },
    data: {
      consultationRequested: true,
      consultationRequestedAt: new Date(),
      diagnosisStatus: 'consulting_needed',
      ...(adminMemo !== undefined ? { adminMemo } : {}),
    },
    select: { id: true, diagnosisStatus: true, consultationRequested: true },
  });
}
```

- [ ] **Step 4: 컨트롤러 수정**

`backend/src/controllers/diagnosis.controller.js` 의 `requestConsultation` 첫 줄을 수정:

```js
    const updated = await diagnosisService.requestConsultation(req.params.id, (req.body && req.body.stepContext) || null);
```

(나머지 본문은 그대로 유지.)

- [ ] **Step 5: 테스트 통과 + 맥락 저장 확인**

Run (서버 구동): `cd backend && npm run smoke:roadmap`
Expected: PASS (`0 failed`).

관리자 토큰으로 상세 조회해 메모 반영 확인 (수동, 선택):
Run: `cd backend && node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/api/export-diagnosis').then(r=>r.json()).then(()=>console.log('admin route requires token — 관리자 화면에서 adminMemo 확인'))"`
Expected: adminMemo에 `[로드맵] 'CPNP 사전 등록' 단계에서 상담 신청` 이 포함 (관리자 화면 `admin.html`에서 확인).

- [ ] **Step 6: 커밋**

```bash
cd backend && git add src/services/diagnosis.service.js src/controllers/diagnosis.controller.js tests/roadmap.smoke.mjs
git commit -m "feat: pass roadmap step context into consultation request memo"
```

---

### Task 5: 프론트 — mypage.html 로드맵 카드

**Files:**
- Modify: `mypage.html` (CSS 블록 + 새 카드 HTML + JS 렌더 함수)

**Interfaces:**
- Consumes (HTTP): `GET /api/members/me/roadmap`, `POST /api/members/me/roadmap/steps/:stepId/toggle`, `POST /api/export-diagnosis/:id/request-consultation`
- 기존 전역 재사용: `API_BASE`, `token`, `esc()`, `document`.

- [ ] **Step 1: CSS 추가**

`mypage.html` `<style>` 안, `/* print report */` 주석 바로 앞에 추가:

```css
  /* export roadmap */
  .rm-top { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:8px; }
  .rm-pct { font-size:26px; font-weight:800; letter-spacing:-0.5px; }
  .rm-sub { font-size:13px; color:var(--muted); }
  .rm-wall { font-size:13px; font-weight:700; color:#c05a1e; background:rgba(224,120,60,0.1); border-radius:999px; padding:5px 12px; }
  .rm-bar { height:8px; border-radius:999px; background:#e2e6ec; overflow:hidden; margin:12px 0 20px; }
  .rm-bar-fill { height:100%; background:var(--blue); border-radius:999px; transition:width .5s ease; }
  .rm-phase { font-size:12px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px; margin:18px 0 8px; }
  .rm-step { display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid rgba(0,0,0,0.05); }
  .rm-step:last-child { border-bottom:none; }
  .rm-check { width:20px; height:20px; flex:0 0 auto; margin-top:2px; border:1.6px solid var(--hairline); border-radius:6px; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; color:#fff; }
  .rm-check.on { background:var(--blue); border-color:var(--blue); }
  .rm-main { flex:1; min-width:0; }
  .rm-title { font-size:14px; font-weight:700; }
  .rm-title.done { color:var(--muted); text-decoration:line-through; }
  .rm-cmt { font-size:12.5px; color:var(--muted); line-height:1.5; margin-top:3px; }
  .rm-tag { display:inline-block; font-size:10.5px; font-weight:800; padding:3px 8px; border-radius:999px; margin-left:8px; vertical-align:middle; }
  .rm-tag.self { background:rgba(46,158,107,0.14); color:#1e7a50; }
  .rm-tag.expert { background:rgba(224,120,60,0.16); color:#c05a1e; }
  .rm-tag.hybrid { background:rgba(214,158,46,0.18); color:#a9741a; }
  .rm-act { margin-top:8px; }
  .rm-link { font-size:12.5px; font-weight:700; color:var(--blue); cursor:pointer; background:none; border:none; padding:0; font-family:inherit; }
  .rm-soon { font-size:11px; font-weight:700; color:var(--muted); background:rgba(0,0,0,0.05); border-radius:999px; padding:3px 9px; }
```

- [ ] **Step 2: 카드 HTML 추가**

`mypage.html` 에서 "내 수출 진행 현황" 카드(현재 140–143행)와 "AI 실무 도구" 카드(145행) **사이**에 추가:

```html
      <div class="card" id="roadmapCard" style="display:none;">
        <h2>내 수출 실행 로드맵</h2>
        <div id="roadmap"></div>
      </div>
```

- [ ] **Step 3: JS 렌더 함수 추가**

`mypage.html` `<script>` 안, `init()` 함수 정의 앞에 추가:

```js
  var PHASE_LABELS = { foundation: '기반 · 제품/규제', sales: '영업 자료', buyer: '바이어' };
  var TAG_LABELS = { self: '셀프', expert: '전문가 필요', hybrid: '점검→전문가' };

  async function renderRoadmap() {
    var card = document.getElementById('roadmapCard');
    var box = document.getElementById('roadmap');
    var data;
    try {
      var res = await fetch(API_BASE + '/api/members/me/roadmap', { headers: { Authorization: 'Bearer ' + token } });
      var j = await res.json();
      if (!j.success || !j.data.hasDiagnosis) { card.style.display = 'none'; return; }
      data = j.data;
    } catch (e) { card.style.display = 'none'; return; }

    card.style.display = 'block';
    var p = data.progress;
    var head = '<div class="rm-top"><span class="rm-pct">' + p.percent + '%</span>'
      + '<span class="rm-sub">' + p.total + '단계 중 ' + p.doneCount + '단계 완료</span>'
      + (p.expertRemaining > 0 ? '<span class="rm-wall">🔴 ' + p.expertRemaining + '단계는 전문가가 필요합니다</span>' : '')
      + '</div><div class="rm-bar"><div class="rm-bar-fill" style="width:' + p.percent + '%"></div></div>';

    var order = ['foundation', 'sales', 'buyer'];
    var bodyHtml = '';
    order.forEach(function (ph) {
      var group = data.steps.filter(function (s) { return s.phase === ph; });
      if (!group.length) return;
      bodyHtml += '<div class="rm-phase">' + esc(PHASE_LABELS[ph] || ph) + '</div>';
      group.forEach(function (s) {
        var act = '';
        if (s.link.type === 'tool') act = '<button class="rm-link" data-href="' + esc(s.link.href) + '" data-act="tool">도구 열기 →</button>';
        else if (s.link.type === 'consulting') act = '<button class="rm-link" data-step="' + esc(s.title) + '" data-act="consult">전문가 상담 신청 →</button>';
        else if (s.link.type === 'soon') act = '<span class="rm-soon">' + esc(s.link.label || '준비 중') + '</span>';
        bodyHtml += '<div class="rm-step">'
          + '<div class="rm-check ' + (s.done ? 'on' : '') + '" data-toggle="' + esc(s.id) + '" data-done="' + (s.done ? '1' : '0') + '">' + (s.done ? '✓' : '') + '</div>'
          + '<div class="rm-main"><div class="rm-title ' + (s.done ? 'done' : '') + '">' + esc(s.title)
          + '<span class="rm-tag ' + s.tag + '">' + esc(TAG_LABELS[s.tag] || s.tag) + '</span></div>'
          + '<div class="rm-cmt">' + esc(s.comment) + '</div>'
          + (act ? '<div class="rm-act">' + act + '</div>' : '')
          + '</div></div>';
      });
    });
    box.innerHTML = head + bodyHtml;

    // 체크박스 토글
    box.querySelectorAll('[data-toggle]').forEach(function (el) {
      el.addEventListener('click', async function () {
        var stepId = el.getAttribute('data-toggle');
        var next = el.getAttribute('data-done') !== '1';
        try {
          await fetch(API_BASE + '/api/members/me/roadmap/steps/' + encodeURIComponent(stepId) + '/toggle', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({ done: next }),
          });
          await renderRoadmap();
        } catch (e) {}
      });
    });
    // 도구 열기
    box.querySelectorAll('[data-act="tool"]').forEach(function (el) {
      el.addEventListener('click', function () { location.href = el.getAttribute('data-href'); });
    });
    // 전문가 상담 신청 (단계 맥락 전달)
    box.querySelectorAll('[data-act="consult"]').forEach(function (el) {
      el.addEventListener('click', async function () {
        if (!data.diagnosisId) return;
        if (!confirm("'" + el.getAttribute('data-step') + "' 관련 전문가 상담을 신청할까요?")) return;
        try {
          var r = await fetch(API_BASE + '/api/export-diagnosis/' + data.diagnosisId + '/request-consultation', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stepContext: el.getAttribute('data-step') }),
          });
          var jr = await r.json();
          if (jr.success) { alert('상담 신청이 접수되었습니다. 담당 전문가가 곧 연락드립니다.'); await renderProgress(); }
          else alert('신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } catch (e) { alert('신청에 실패했습니다.'); }
      });
    });
  }
```

- [ ] **Step 4: init()에서 렌더 호출**

`mypage.html` `init()` 내부, `await renderProgress();` (현재 212행) 바로 다음 줄에 추가:

```js
      await renderRoadmap();
```

- [ ] **Step 5: 브라우저 검증**

정적 서버(4599)와 백엔드(4000) 구동 후, 테스트 회원으로 로그인해 `mypage.html` 확인:
- 로드맵 카드가 보이고 상단에 `NN% · 16단계 중 N단계 완료 · 🔴 M단계는 전문가가 필요합니다` 노출.
- 체크박스 클릭 시 진행률/바가 갱신됨(서버 왕복 후 재렌더).
- 🟢 셀프 단계에 "도구 열기 →" → `email.html` 이동.
- 🔴/🟡 단계에 "전문가 상담 신청 →" → 확인창 → 접수 알림, "내 수출 진행 현황"에 상담 신청 배지 반영.

검증 방법: preview 도구로 `mypage.html` 로드 후 로드맵 카드 스냅샷/인스펙트. (로그인 토큰이 필요하므로, 로그인 플로우 또는 localStorage에 유효 토큰 주입 후 확인.)

- [ ] **Step 6: 커밋**

```bash
git add mypage.html
git commit -m "feat: add export roadmap card to member mypage"
```

---

## Self-Review

**Spec coverage (모듈 1):**
- 진단→로드맵 생성·표시: Task 1(로직)+Task 5(표시) ✓
- 16단계·셀프/전문가 태그·완료판정: Task 1 ✓
- 셀프체크 진행률: Task 1(계산)+Task 2(저장)+Task 3(API)+Task 5(UI) ✓
- 🟢→도구 연결, 🔴→맥락 프리필 컨설팅: Task 4+Task 5 ✓
- 하이브리드 엔진(규칙 기반, Claude 교체지점 격리): Task 1 `comment` 필드 ✓
- 마이페이지 통합(별도 페이지 아님): Task 5 ✓
- v1 제외항목(Claude 문장/활동감지/재진단/카탈로그 생성기): 계획에 미포함 ✓ (카탈로그 단계는 `soon` 배지로만 노출)

**Placeholder scan:** 모든 코드 스텝에 실제 코드/명령/기대출력 포함. TODO/TBD 없음. ✓

**Type consistency:** `buildRoadmap` 반환 `{ steps, progress:{ total, doneCount, expertRemaining, percent } }` — Task 2 `getRoadmap`, Task 3 smoke, Task 5 렌더에서 동일 필드명 사용. `link.type` 값(`info|tool|consulting|soon`)이 Task 1 정의와 Task 5 분기 일치. `isValidStepId`가 Task 1 export ↔ Task 3 컨트롤러 사용 일치. ✓

**모듈 2는 별도 스펙**: 카탈로그 생성기/업로드 진단은 이 계획 범위 밖(`soon` 배지로만 표시). 설계 문서 §3 참조.
