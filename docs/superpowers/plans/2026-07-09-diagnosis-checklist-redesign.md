# 수출 준비도 진단 개편(체크리스트형) 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수출 준비도 진단을 4단계 입력폼에서 "해당되는 것을 모두 체크" 준비도 체크리스트로 개편하되, 기존 4영역 채점 공식·결과 구조·리드 확보·상담 전환 훅을 그대로 계승한다.

**Architecture:** 새 스택(Next.js App Router + Supabase). 순수 함수 진단 엔진 `generateDiagnosis(answers: ChecklistAnswers): DiagnosisResult` 이 체크리스트 응답을 직접 소비한다(입력 구조만 개편, 공식은 계승). 진단 화면은 클라이언트 폼(연락처 + 체크리스트 + 필수 동의)이고, 제출은 Server Action 이 서비스롤 클라이언트로 행을 삽입하고 엔진을 호출해 결과를 저장·반환한다. 결과 화면은 비회원 가입(Supabase Auth)으로 결과를 계정에 연결한다.

**Tech Stack:** Next.js 15 (App Router, React 19), TypeScript, Supabase (Postgres/Auth, `@supabase/ssr`·`@supabase/supabase-js`), vitest.

## Global Constraints

- 스펙: `docs/superpowers/specs/2026-07-09-diagnosis-checklist-redesign-design.md` (본 플랜의 근거).
- 상위 스펙: `docs/superpowers/specs/2026-07-09-vercel-supabase-migration-design.md` (P2에 해당).
- **선행 의존성(P1)**: 본 플랜은 P1 완료 위에서 실행한다 — `web/` Next.js 스캐폴드, Supabase 스키마 `web/supabase/migrations/0001_init.sql`, Auth·세션 미들웨어, 서버/서비스/브라우저 클라이언트(`@/lib/supabase/*`). P1이 미완이면 이 플랜을 시작하지 않는다.
- 테스트 러너: vitest. 테스트는 대상 소스와 같은 폴더에 `*.test.ts` 로 둔다(`vitest.config.ts` include `lib/**/*.test.ts`). 실행: `npm test`(=`vitest run`). **UI 코드는 vitest 대상 아님** — 엔진/매핑 등 `lib/**` 순수 로직만 단위 테스트한다.
- 경로 별칭: `@/` → `web/` 루트. 모든 import 는 `@/lib/...` 형태.
- 쓰기/RLS 우회는 **서버(서비스롤)** 로만: `@/lib/supabase/service` 의 `createServiceClient()`. 서비스롤 클라이언트는 클라이언트 컴포넌트에서 절대 import 하지 않는다.
- **채점 공식·가중치·임계값은 기존 `backend/src/services/aiDiagnosis.service.js` 값을 그대로 계승.** 준비수준 임계값: 종합 ≥75 "준비됨", ≥55 "부분 준비됨", 그 외 "준비 필요". 각 영역 점수는 `clamp` = `max(5, min(98, round(n)))`.
- 개인정보 동의: 필수 동의 1줄. 미체크 시 제출 차단. 게이트 2지점(① 진단 제출 ② 결과화면 비회원 가입). 마케팅 동의·동의 이력 저장은 범위 아님.
- 모든 명령은 `web/` 디렉터리에서 실행한다. **주의: 현재 작업 폴더는 P1 에이전트와 공유될 수 있으므로, 실행 전 격리 워크트리(`superpowers:using-git-worktrees`)에서 진행할 것.**

---

## File Structure

**생성**
- `web/lib/constants/diagnosisChecklist.ts` — 체크리스트 문항 정의(4영역·항목 라벨·키) + 맥락 선택지(제품 카테고리·목표 국가).
- `web/lib/services/diagnosis/types.ts` — `ChecklistAnswers`, `DiagnosisResult`(+ 하위 타입).
- `web/lib/services/diagnosis/generateDiagnosis.ts` — 순수 진단 엔진(공식 계승).
- `web/lib/services/diagnosis/generateDiagnosis.test.ts` — 회귀 테스트.
- `web/lib/services/diagnosis/toRow.ts` — `ChecklistAnswers`(+연락처/제품 맥락) → DB 행 컬럼 매핑.
- `web/lib/services/diagnosis/toRow.test.ts` — 매핑 단위 테스트.
- `web/supabase/migrations/0002_diagnosis_checklist.sql` — `checklist_answers jsonb` 추가 + 개편으로 사라진 `has_inci` NOT NULL 완화.
- `web/app/(public)/diagnose/page.tsx` — 진단 페이지(서버 컴포넌트 셸: 회원 프리필 조회 + 폼 마운트).
- `web/app/(public)/diagnose/DiagnoseForm.tsx` — 클라이언트 폼(연락처 + 체크리스트 + 필수 동의).
- `web/app/(public)/diagnose/actions.ts` — Server Action: 제출 → 삽입 → 진단 → 결과 id 반환.
- `web/app/(public)/diagnose/result/[id]/page.tsx` — 결과 화면(서버 컴포넌트) + 비회원 가입/회원 저장 안내.
- `web/app/(public)/diagnose/result/[id]/ResultActions.tsx` — 클라이언트: 비회원 가입 폼(필수 동의) + 상담 신청 버튼.
- `web/scripts/smoke-diagnose.mjs` — 제출→진단→행 저장 E2E 스모크(로컬 Supabase 대상).

**참조(수정 없음, 스타일/문구 근거)**
- 구 진단 UI: `diagnose.html`(체크박스/동의 박스 스타일·문구), 구 엔진: `backend/src/services/aiDiagnosis.service.js`(공식 원본).

---

## Task 1: 체크리스트 문항 상수

**Files:**
- Create: `web/lib/constants/diagnosisChecklist.ts`
- Test: (상수만 — 별도 테스트 없음. Task 3 에서 키 사용으로 간접 검증)

**Interfaces:**
- Produces:
  - `type ChecklistKey`(아래 16개 항목 키의 유니온)
  - `CHECKLIST_GROUPS: ChecklistGroup[]` — `{ area: string; title: string; note?: string; items: { key: ChecklistKey; label: string }[] }[]`
  - `PRODUCT_CATEGORIES: string[]`, `TARGET_COUNTRIES: string[]`

- [ ] **Step 1: 상수 파일 작성**

```ts
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
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `cd web && npx tsc --noEmit`
Expected: 에러 없음(신규 파일 컴파일 성공).

- [ ] **Step 3: 커밋**

```bash
git add web/lib/constants/diagnosisChecklist.ts
git commit -m "feat(diagnosis): checklist item + context option constants"
```

---

## Task 2: 진단 타입 정의

**Files:**
- Create: `web/lib/services/diagnosis/types.ts`

**Interfaces:**
- Consumes: `ChecklistKey` (Task 1).
- Produces:
  - `type ChecklistAnswers = Record<ChecklistKey, boolean> & { companyName: string }`
  - `interface DiagnosisResult` (아래 필드) 및 하위 `SectionResult`, `Priority`, `EuStatus`, `ConsultingNeed`.

- [ ] **Step 1: 타입 파일 작성**

```ts
// web/lib/services/diagnosis/types.ts
import type { ChecklistKey } from "@/lib/constants/diagnosisChecklist";

// 16개 체크 항목의 불리언 + 요약 문구용 회사명
export type ChecklistAnswers = Record<ChecklistKey, boolean> & {
  companyName: string;
};

export interface SectionResult {
  score: number;
  label: string;
  comment: string;
  gaps: string[];
}
export interface Priority {
  label: string;
  note: string;
}
export interface EuStatus {
  haveCount: number;
  total: number;
  missing: string[];
}
export interface ConsultingNeed {
  level: "보통" | "높음";
  pitch: string;
  recommendedTopics: string[];
}

export interface DiagnosisResult {
  isBasic: true;
  overallScore: number;
  readinessLevel: "준비됨" | "부분 준비됨" | "준비 필요";
  summary: string;
  sections: {
    productReadiness: SectionResult;
    euRegulationReadiness: SectionResult;
    salesMaterialReadiness: SectionResult;
    buyerFollowUpReadiness: SectionResult;
  };
  euStatus: EuStatus;
  priorities: Priority[];
  consultingNeed: ConsultingNeed;
  nextActions: string[];
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `cd web && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add web/lib/services/diagnosis/types.ts
git commit -m "feat(diagnosis): ChecklistAnswers + DiagnosisResult types"
```

---

## Task 3: 진단 엔진 (순수 함수) — TDD

구 `aiDiagnosis.service.js` 의 공식을 그대로 계승하되 입력을 `ChecklistAnswers` 로 바꾼다. **의도적 결정(스펙 계승 원칙의 세부):**
- 포장(PPWR) 점수: 체크수 `p` 에 대해 `p>0 ? 50 + p*10 : 20`. 구 엔진의 중간값 40("인지했으나 미준비")은 체크리스트로 표현 불가하므로 0개 체크는 20으로 처리한다.
- 영업자료 +15 신호: 구 엔진의 "제품 파일 업로드"(+15) 대신 **Offer Sheet 보유(+15)** 로 대체.
- 바이어 Follow-up −15: 구 엔진의 "박람회 후 Follow-up 안 됨" pain 대신 **박람회 경험 없음(−15)** 으로 대체.
- `recommendedTopics`: 구 엔진의 자유 pain 대신 `[가장 약한 영역 라벨, 우선과제 상위 2개 라벨]` 중복 제거.

**Files:**
- Create: `web/lib/services/diagnosis/generateDiagnosis.ts`
- Test: `web/lib/services/diagnosis/generateDiagnosis.test.ts`

**Interfaces:**
- Consumes: `ChecklistAnswers`, `DiagnosisResult` (Task 2).
- Produces: `export function generateDiagnosis(a: ChecklistAnswers): DiagnosisResult`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// web/lib/services/diagnosis/generateDiagnosis.test.ts
import { describe, it, expect } from "vitest";
import { generateDiagnosis } from "./generateDiagnosis";
import type { ChecklistAnswers } from "./types";
import { CHECKLIST_GROUPS } from "@/lib/constants/diagnosisChecklist";

// 모든 항목 false 로 시작하는 헬퍼
function base(overrides: Partial<ChecklistAnswers> = {}): ChecklistAnswers {
  const a: Record<string, boolean> = {};
  for (const g of CHECKLIST_GROUPS) for (const it of g.items) a[it.key] = false;
  return { ...(a as ChecklistAnswers), companyName: "테스트브랜드", ...overrides };
}

describe("generateDiagnosis", () => {
  it("전부 미체크 → 낮은 점수 + 전 영역 갭 + EU 7개 전부 missing", () => {
    const r = generateDiagnosis(base());
    expect(r.readinessLevel).toBe("준비 필요");
    expect(r.euStatus.haveCount).toBe(0);
    expect(r.euStatus.missing).toHaveLength(7);
    expect(r.sections.productReadiness.gaps).toContain("국내 판매 실적/레퍼런스");
    expect(r.sections.productReadiness.gaps).toContain("인증 확보(GMP·ISO 22716 등)");
    // 제품 경쟁력 = clamp(45) = 45
    expect(r.sections.productReadiness.score).toBe(45);
    // EU = clamp(20*0.8 + 20*0.2) = clamp(20) = 20
    expect(r.sections.euRegulationReadiness.score).toBe(20);
  });

  it("EU 필수 7요건 전부 체크 → euStatus.missing 비고 haveCount 7", () => {
    const r = generateDiagnosis(
      base({ euRp: true, euCpnp: true, euPif: true, euCpsr: true, euInci: true, euLabeling: true, euAllergen: true })
    );
    expect(r.euStatus.haveCount).toBe(7);
    expect(r.euStatus.missing).toHaveLength(0);
    // euBase = 20 + (7/7)*70 = 90, pkg 0 → 20 ; EU = clamp(90*0.8 + 20*0.2) = clamp(76) = 76
    expect(r.sections.euRegulationReadiness.score).toBe(76);
  });

  it("제품 경쟁력 전부 체크 → clamp(45+25+18+10)=98", () => {
    const r = generateDiagnosis(base({ sellingInKorea: true, hasManufacturingCert: true, hasSalesRecord: true }));
    expect(r.sections.productReadiness.score).toBe(98);
    expect(r.sections.productReadiness.gaps).toHaveLength(0);
  });

  it("접점 바이어 없음 → 우선과제에 '타겟 바이어 발굴' 포함", () => {
    const r = generateDiagnosis(base());
    expect(r.priorities.some((p) => p.label === "타겟 바이어 발굴")).toBe(true);
  });

  it("접점 바이어 있음 → 우선과제에 'Follow-up·협상 전략' 계열 포함", () => {
    const r = generateDiagnosis(base({ hasBuyer: true }));
    expect(r.priorities.some((p) => p.label.includes("Follow-up"))).toBe(true);
  });

  it("전부 체크 → 종합점수 상승 + Offer Sheet/영문자료 갭 없음", () => {
    const all = base();
    for (const k of Object.keys(all)) if (typeof (all as any)[k] === "boolean") (all as any)[k] = true;
    const r = generateDiagnosis(all);
    expect(r.overallScore).toBeGreaterThanOrEqual(75);
    expect(r.readinessLevel).toBe("준비됨");
    expect(r.sections.salesMaterialReadiness.gaps).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd web && npx vitest run lib/services/diagnosis/generateDiagnosis.test.ts`
Expected: FAIL — "generateDiagnosis is not a function" (모듈 없음).

- [ ] **Step 3: 엔진 구현**

```ts
// web/lib/services/diagnosis/generateDiagnosis.ts
// 규칙 기반 자동 진단(훅). 구 backend/src/services/aiDiagnosis.service.js 공식 계승,
// 입력만 ChecklistAnswers 로 개편. 향후 LLM 교체 지점은 comment/summary/pitch 문구뿐.
import type { ChecklistAnswers, DiagnosisResult, Priority } from "./types";

// EU 필수 7요건: 체크 키 → 화면 표기 라벨
const EU_ITEMS: { key: keyof ChecklistAnswers; label: string }[] = [
  { key: "euRp", label: "EU 책임자(RP) 지정" },
  { key: "euCpnp", label: "CPNP 사전 등록" },
  { key: "euPif", label: "PIF(제품정보파일) 구비" },
  { key: "euCpsr", label: "CPSR(안전성보고서) 작성" },
  { key: "euInci", label: "INCI 전성분 적합성" },
  { key: "euLabeling", label: "EU 라벨링 요건" },
  { key: "euAllergen", label: "향료 알레르겐 표시" },
];
const PKG_KEYS: (keyof ChecklistAnswers)[] = [
  "pkgRecyclable",
  "pkgDoc",
  "pkgTechDoc",
  "pkgRecycledContent",
];

function clamp(n: number): number {
  return Math.max(5, Math.min(98, Math.round(n)));
}

export function generateDiagnosis(a: ChecklistAnswers): DiagnosisResult {
  const company = a.companyName || "브랜드";

  // 1) 제품 경쟁력
  const productReadiness = clamp(
    45 + (a.sellingInKorea ? 25 : 0) + (a.hasManufacturingCert ? 18 : 0) + (a.hasSalesRecord ? 10 : 0)
  );

  // 2) EU 규제 준비 (핵심 7요건 + PPWR)
  const euHave = EU_ITEMS.filter((x) => a[x.key]).length; // 0..7
  const euNone = euHave === 0;
  const euBase = euNone ? 20 : 20 + (euHave / EU_ITEMS.length) * 70; // 20..90
  const pkgReady = PKG_KEYS.filter((k) => a[k]).length; // 0..4
  const pkgScore = pkgReady > 0 ? 50 + pkgReady * 10 : 20; // 0개 체크 → 20 (중간값 40 미표현)
  const euRegulationReadiness = clamp(euBase * 0.8 + pkgScore * 0.2);

  // 3) 영업 자료
  let sales = 62;
  if (!a.hasEnglishCatalog) sales -= 22;
  if (a.hasOfferSheet) sales += 15;
  const salesMaterialReadiness = clamp(sales);

  // 4) 바이어 대응
  let follow = 45 + (a.hasBuyer ? 25 : 0) + (a.hasExportExperience ? 15 : 0);
  if (!a.hasTradeFairExperience) follow -= 15;
  const buyerFollowUpReadiness = clamp(follow);

  const overallScore = Math.round(
    (productReadiness + euRegulationReadiness + salesMaterialReadiness + buyerFollowUpReadiness) / 4
  );
  const readinessLevel =
    overallScore >= 75 ? "준비됨" : overallScore >= 55 ? "부분 준비됨" : "준비 필요";

  // ── 갭 산출 ──
  const missingEu = EU_ITEMS.filter((x) => !a[x.key]).map((x) => x.label);
  const pkgMissing = pkgReady === 0;

  const productGaps: string[] = [];
  if (!a.sellingInKorea) productGaps.push("국내 판매 실적/레퍼런스");
  if (!a.hasManufacturingCert) productGaps.push("인증 확보(GMP·ISO 22716 등)");

  const euGaps = missingEu.slice();
  if (pkgMissing) euGaps.push("PPWR 포장 규정 대응");

  const salesGaps: string[] = [];
  if (!a.hasEnglishCatalog) salesGaps.push("영문 카탈로그·회사소개서");
  if (!a.hasOfferSheet) salesGaps.push("Offer Sheet(가격·MOQ·Incoterms)");

  const buyerGaps: string[] = [];
  if (!a.hasBuyer) buyerGaps.push("타겟 바이어 리스트");
  if (!a.hasTradeFairExperience || !a.hasExportExperience) buyerGaps.push("바이어 Follow-up 전략");

  const sections = {
    productReadiness: {
      score: productReadiness,
      label: "제품 경쟁력",
      comment: a.sellingInKorea
        ? "국내 판매 실적이 있어 바이어 설득의 근거가 됩니다."
        : "국내 판매 실적/인증을 보강하면 신뢰도가 올라갑니다.",
      gaps: productGaps,
    },
    euRegulationReadiness: {
      score: euRegulationReadiness,
      label: "EU 규제 준비",
      comment: euNone
        ? "책임자(RP)·CPNP·PIF 등 필수 요건 준비가 시급합니다."
        : `핵심 요건 ${euHave}/7개 확보. 남은 항목과 PPWR 대응이 필요합니다.`,
      gaps: euGaps,
    },
    salesMaterialReadiness: {
      score: salesMaterialReadiness,
      label: "영업 자료",
      comment: a.hasEnglishCatalog
        ? "영문 자료가 있어 바이어 검토를 앞당길 수 있습니다."
        : "영문 카탈로그·Offer Sheet 준비가 필요합니다.",
      gaps: salesGaps,
    },
    buyerFollowUpReadiness: {
      score: buyerFollowUpReadiness,
      label: "바이어 대응",
      comment: a.hasBuyer
        ? "접점 바이어가 있어 Follow-up 전략이 즉시 필요합니다."
        : "바이어 발굴부터 체계적으로 시작해야 합니다.",
      gaps: buyerGaps,
    },
  };

  // 가장 약한 축
  const weakest = Object.values(sections).reduce((acc, s) => (s.score < acc.score ? s : acc));
  const consultingLevel: "보통" | "높음" = overallScore >= 75 ? "보통" : "높음";

  // ── 우선 해결 과제 Top 3 (구 엔진 가중치 계승) ──
  const pool: { weight: number; label: string; note: string }[] = [];
  if (missingEu.length >= 3) {
    pool.push({
      weight: 100,
      label: `EU 필수 요건 ${missingEu.length}개 미비`,
      note: `${missingEu.slice(0, 3).join(", ")} 등 — EU 판매 전 반드시 갖춰야 하며, 대부분 전문가 준비가 필요합니다.`,
    });
  } else {
    missingEu.forEach((l) =>
      pool.push({ weight: 95, label: `${l} 준비`, note: "EU 판매를 위한 필수 요건입니다." })
    );
  }
  if (salesMaterialReadiness < 62)
    pool.push({
      weight: 60,
      label: "바이어용 영문 자료 준비",
      note: "영문 카탈로그·Offer Sheet가 있어야 바이어가 검토를 시작합니다.",
    });
  if (!a.hasBuyer)
    pool.push({ weight: 74, label: "타겟 바이어 발굴", note: "검증된 바이어 리스트 확보는 전문가의 핵심 영역입니다." });
  else
    pool.push({
      weight: 66,
      label: "바이어 Follow-up·협상 전략",
      note: "접점 바이어를 실제 계약까지 잇는 전략이 필요합니다.",
    });
  if (pkgMissing)
    pool.push({ weight: 52, label: "PPWR 포장 규정 대응", note: "새 EU 포장 규정에 맞춘 대응 전략을 세워야 합니다." });
  if (!a.hasManufacturingCert)
    pool.push({ weight: 44, label: "인증 확보", note: "GMP·ISO 22716·비건 등 인증이 바이어 신뢰를 높입니다." });

  const priorities: Priority[] = pool
    .sort((x, y) => y.weight - x.weight)
    .slice(0, 3)
    .map(({ label, note }) => ({ label, note }));

  const euStatus = { haveCount: euHave, total: EU_ITEMS.length, missing: missingEu };

  // ── 맞춤 요약 / 컨설팅 훅 ──
  const euGapLine = missingEu.length
    ? ` EU 필수 요건 ${EU_ITEMS.length}개 중 ${missingEu.length}개(${missingEu.slice(0, 2).join(", ")} 등)가 아직 준비되지 않았습니다.`
    : " EU 필수 요건은 대체로 갖추셨습니다.";
  const summary = `${company}의 유럽 수출 준비도는 100점 만점에 ${overallScore}점(${readinessLevel})입니다.${euGapLine} 특히 '${weakest.label}' 영역이 가장 큰 병목입니다.`;

  const topGap = priorities[0] ? priorities[0].label : weakest.label;
  const pitch = `이 진단은 기본 분석입니다. 특히 '${topGap}'은(는) 혼자 해결하기 어렵습니다. 바이어 매칭과 실제 계약까지 가려면, 대표님 브랜드에 맞춘 전문가 컨설팅이 결정적입니다.`;

  const recommendedTopics = Array.from(
    new Set([weakest.label, ...priorities.slice(0, 2).map((p) => p.label)])
  );

  const nextActions: string[] = [];
  if (euRegulationReadiness < 60) nextActions.push("EU 책임자(RP) 지정과 CPNP 등록 로드맵을 세우세요.");
  if (salesMaterialReadiness < 60) nextActions.push("바이어가 반응하는 영문 카탈로그/Offer Sheet를 준비하세요.");
  if (buyerFollowUpReadiness < 60) nextActions.push("목표 바이어 리스트와 Follow-up 이메일 전략을 마련하세요.");
  if (nextActions.length < 3) nextActions.push("가장 약한 영역부터 전문가와 단계별 실행 계획을 잡으세요.");

  return {
    isBasic: true,
    overallScore,
    readinessLevel,
    summary,
    sections,
    euStatus,
    priorities,
    consultingNeed: {
      level: consultingLevel,
      pitch,
      recommendedTopics,
    },
    nextActions: nextActions.slice(0, 3),
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd web && npx vitest run lib/services/diagnosis/generateDiagnosis.test.ts`
Expected: PASS (6 케이스 전부).

- [ ] **Step 5: 커밋**

```bash
git add web/lib/services/diagnosis/generateDiagnosis.ts web/lib/services/diagnosis/generateDiagnosis.test.ts
git commit -m "feat(diagnosis): checklist-driven scoring engine + regression tests"
```

---

## Task 4: 응답→행 매핑 + 마이그레이션 — TDD

체크리스트 응답 + 연락처/제품 맥락을 `export_diagnosis_requests` 삽입 행으로 변환한다. 원본(raw) 응답은 `checklist_answers` jsonb 에 저장하고, 관리자 화면 호환을 위해 레거시 컬럼 일부도 파생 채움한다.

**Files:**
- Create: `web/supabase/migrations/0002_diagnosis_checklist.sql`
- Create: `web/lib/services/diagnosis/toRow.ts`
- Test: `web/lib/services/diagnosis/toRow.test.ts`

**Interfaces:**
- Consumes: `ChecklistAnswers` (Task 2), `DiagnosisResult` (Task 2).
- Produces:
  - `interface DiagnoseInput { contact: {...}; product: {...}; answers: ChecklistAnswers; consentedAt: string; memberId: string | null; }`
  - `export function toRow(input: DiagnoseInput, result: DiagnosisResult): Record<string, unknown>` — Supabase insert payload.

- [ ] **Step 1: 마이그레이션 작성**

```sql
-- web/supabase/migrations/0002_diagnosis_checklist.sql
-- 체크리스트형 진단 개편: 원본 응답 저장 컬럼 + 개편으로 사라진 필드 제약 완화.
-- 스펙: docs/superpowers/specs/2026-07-09-diagnosis-checklist-redesign-design.md

alter table public.export_diagnosis_requests
  add column if not exists checklist_answers jsonb not null default '{}'::jsonb;

-- 체크리스트가 더 이상 직접 수집하지 않는 필드의 NOT NULL 완화
alter table public.export_diagnosis_requests
  alter column has_inci drop not null;
```

- [ ] **Step 2: 실패하는 매핑 테스트 작성**

```ts
// web/lib/services/diagnosis/toRow.test.ts
import { describe, it, expect } from "vitest";
import { toRow, type DiagnoseInput } from "./toRow";
import { generateDiagnosis } from "./generateDiagnosis";
import type { ChecklistAnswers } from "./types";
import { CHECKLIST_GROUPS } from "@/lib/constants/diagnosisChecklist";

function answers(overrides: Partial<ChecklistAnswers> = {}): ChecklistAnswers {
  const a: Record<string, boolean> = {};
  for (const g of CHECKLIST_GROUPS) for (const it of g.items) a[it.key] = false;
  return { ...(a as ChecklistAnswers), companyName: "다은코스메틱", ...overrides };
}
function input(a: ChecklistAnswers): DiagnoseInput {
  return {
    contact: { contactName: "김담당", companyName: "다은코스메틱", email: "d@c.co", phone: "010", homepageUrl: null, smartStoreUrl: null, instagramUrl: null },
    product: { productName: "수분크림", productCategory: "스킨케어", targetCountries: ["독일"] },
    answers: a,
    consentedAt: "2026-07-09T00:00:00.000Z",
    memberId: null,
  };
}

describe("toRow", () => {
  it("raw 응답을 checklist_answers 에 저장한다", () => {
    const a = answers({ euRp: true });
    const row = toRow(input(a), generateDiagnosis(a));
    expect((row.checklist_answers as ChecklistAnswers).euRp).toBe(true);
  });

  it("EU 체크를 eu_compliance_readiness 배열로 파생 채움한다", () => {
    const a = answers({ euRp: true, euCpnp: true });
    const row = toRow(input(a), generateDiagnosis(a));
    expect(row.eu_compliance_readiness).toEqual(
      expect.arrayContaining(["EU 책임자(Responsible Person) 지정", "CPNP 사전 등록"])
    );
  });

  it("바이어 체크를 has_existing_buyer 로 파생 채움한다", () => {
    const a = answers({ hasBuyer: true });
    const row = toRow(input(a), generateDiagnosis(a));
    expect(row.has_existing_buyer).toBe("있음");
  });

  it("diagnosis_result 와 consultation 기본값을 채운다", () => {
    const a = answers();
    const row = toRow(input(a), generateDiagnosis(a));
    expect((row.diagnosis_result as any).overallScore).toBeGreaterThan(0);
    expect(row.diagnosis_status).toBe("submitted");
    expect(row.member_id).toBeNull();
  });
});
```

- [ ] **Step 3: 매핑 테스트 실패 확인**

Run: `cd web && npx vitest run lib/services/diagnosis/toRow.test.ts`
Expected: FAIL — "toRow is not a function".

- [ ] **Step 4: 매핑 구현**

```ts
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
```

- [ ] **Step 5: 매핑 테스트 통과 확인**

Run: `cd web && npx vitest run lib/services/diagnosis/toRow.test.ts`
Expected: PASS (4 케이스).

- [ ] **Step 6: 전체 테스트 + 타입체크**

Run: `cd web && npm test && npx tsc --noEmit`
Expected: 모든 테스트 PASS, 타입 에러 없음.

- [ ] **Step 7: 커밋**

```bash
git add web/supabase/migrations/0002_diagnosis_checklist.sql web/lib/services/diagnosis/toRow.ts web/lib/services/diagnosis/toRow.test.ts
git commit -m "feat(diagnosis): answers->row mapping + checklist_answers migration"
```

---

## Task 5: 진단 화면 (연락처 + 체크리스트 + 필수 동의)

시작 정보(연락처·제품 맥락) + 준비도 체크리스트를 한 화면에 렌더. 마지막 제출 버튼 직전에 필수 동의 게이트. 회원이면 서버가 프리필 값을 내려준다.

**Files:**
- Create: `web/app/(public)/diagnose/page.tsx`
- Create: `web/app/(public)/diagnose/DiagnoseForm.tsx`

**Interfaces:**
- Consumes: `CHECKLIST_GROUPS`, `PRODUCT_CATEGORIES`, `TARGET_COUNTRIES` (Task 1); `submitDiagnosis` (Task 6).
- Produces: 사용자 입력을 모아 `submitDiagnosis(formData)` 를 호출하는 폼. (Task 6 이 먼저 없으면 import 는 임시로 주석 처리하지 말고 Task 6 을 이 태스크와 함께 실행한다 — Step 3 참조.)

- [ ] **Step 1: 서버 셸 페이지 작성 (회원 프리필 조회)**

```tsx
// web/app/(public)/diagnose/page.tsx
import { createClient } from "@/lib/supabase/server";
import DiagnoseForm from "./DiagnoseForm";

export default async function DiagnosePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let prefill = { contactName: "", companyName: "", email: "", phone: "" };
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, company_name, phone")
      .eq("id", user.id)
      .single();
    prefill = {
      contactName: profile?.name ?? "",
      companyName: profile?.company_name ?? "",
      email: user.email ?? "",
      phone: profile?.phone ?? "",
    };
  }

  return <DiagnoseForm prefill={prefill} isMember={!!user} />;
}
```

- [ ] **Step 2: 클라이언트 폼 작성**

```tsx
// web/app/(public)/diagnose/DiagnoseForm.tsx
"use client";

import { useState } from "react";
import {
  CHECKLIST_GROUPS,
  PRODUCT_CATEGORIES,
  TARGET_COUNTRIES,
} from "@/lib/constants/diagnosisChecklist";
import { submitDiagnosis } from "./actions";

interface Prefill {
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
}

export default function DiagnoseForm({ prefill, isMember }: { prefill: Prefill; isMember: boolean }) {
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    if (!consent) {
      setError("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }
    setSubmitting(true);
    // Server Action 이 성공 시 결과 페이지로 redirect 한다.
    await submitDiagnosis(formData);
    setSubmitting(false);
  }

  return (
    <form action={handleSubmit} style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1>수출 준비도 진단</h1>

      {/* 시작 정보 */}
      <fieldset>
        <legend>시작 정보</legend>
        <input name="contactName" placeholder="담당자명" defaultValue={prefill.contactName} required />
        <input name="companyName" placeholder="회사명" defaultValue={prefill.companyName} required />
        <input name="email" type="email" placeholder="이메일" defaultValue={prefill.email} required />
        <input name="phone" type="tel" placeholder="전화번호" defaultValue={prefill.phone} required />
        <input name="homepageUrl" type="url" placeholder="홈페이지 (선택)" />
        <input name="smartStoreUrl" type="url" placeholder="스마트스토어 (선택)" />
        <input name="instagramUrl" type="url" placeholder="인스타그램 (선택)" />
        <input name="productName" placeholder="대표 제품명" required />
        <select name="productCategory" required defaultValue="">
          <option value="" disabled>
            제품 카테고리
          </option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div>
          <p>목표 국가 (복수 선택)</p>
          {TARGET_COUNTRIES.map((c) => (
            <label key={c}>
              <input type="checkbox" name="targetCountries" value={c} /> {c}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 준비도 체크리스트 */}
      <h2>수출 준비도 — 해당되는 것을 모두 체크하세요</h2>
      {CHECKLIST_GROUPS.map((g, i) => (
        <fieldset key={`${g.area}-${i}`}>
          <legend>{g.title}</legend>
          {g.note && <p style={{ fontSize: 13, color: "#6e6e73" }}>{g.note}</p>}
          {g.items.map((it) => (
            <label key={it.key} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input type="checkbox" name={it.key} value="1" />
              <span>{it.label}</span>
            </label>
          ))}
        </fieldset>
      ))}

      {/* 필수 동의 게이트 */}
      <div style={{ margin: "20px 0", padding: "13px 15px", background: "rgba(0,102,204,0.04)", borderRadius: 12 }}>
        <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontWeight: 600 }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          개인정보 수집 및 이용에 동의합니다. <span style={{ color: "#0066cc" }}>*</span>
        </label>
        <p style={{ fontSize: 12.5, color: "#6e6e73", marginTop: 8 }}>
          본 양식 제출 시 BridgeX의{" "}
          <a href="/terms" target="_blank" rel="noopener">
            이용약관
          </a>{" "}
          및{" "}
          <a href="/privacy" target="_blank" rel="noopener">
            개인정보처리방침
          </a>
          에 동의하게 됩니다.
        </p>
        {error && <p style={{ color: "#d64545", fontWeight: 600, marginTop: 8 }}>{error}</p>}
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "진단 중..." : "수출 가능성 진단하기"}
      </button>
    </form>
  );
}
```

> 스타일은 최소 인라인이다. 프로덕션 스타일은 `diagnose.html` 의 클래스(`consent-box`, `consent-check` 등)를 참고해 후속 스타일링 태스크에서 맞춘다(본 플랜 범위 아님).

- [ ] **Step 3: Task 6 와 함께 타입체크**

`submitDiagnosis` 는 Task 6 에서 정의된다. 이 태스크와 Task 6 을 연속 실행한 뒤 함께 타입체크한다.
Run: `cd web && npx tsc --noEmit`
Expected: 에러 없음. (Task 6 미완이면 `submitDiagnosis` 미해결 에러 — 정상. Task 6 완료 후 통과.)

- [ ] **Step 4: 커밋** (Task 6 커밋과 묶어도 됨)

```bash
git add "web/app/(public)/diagnose/page.tsx" "web/app/(public)/diagnose/DiagnoseForm.tsx"
git commit -m "feat(diagnose): checklist form UI with contact + consent gate"
```

---

## Task 6: 제출 Server Action

폼 데이터를 파싱해 `ChecklistAnswers` 로 조립하고, 엔진으로 진단한 뒤 서비스롤 클라이언트로 행을 삽입하고 결과 페이지로 redirect 한다.

**Files:**
- Create: `web/app/(public)/diagnose/actions.ts`

**Interfaces:**
- Consumes: `CHECKLIST_GROUPS` (Task 1), `generateDiagnosis` (Task 3), `toRow`·`DiagnoseInput` (Task 4), `createServiceClient` (`@/lib/supabase/service`), `createClient` (`@/lib/supabase/server`).
- Produces: `export async function submitDiagnosis(formData: FormData): Promise<void>` — 성공 시 `/diagnose/result/<id>` 로 redirect.

- [ ] **Step 1: Server Action 작성**

```ts
// web/app/(public)/diagnose/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { CHECKLIST_GROUPS } from "@/lib/constants/diagnosisChecklist";
import { generateDiagnosis } from "@/lib/services/diagnosis/generateDiagnosis";
import { toRow, type DiagnoseInput } from "@/lib/services/diagnosis/toRow";
import type { ChecklistAnswers } from "@/lib/services/diagnosis/types";

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function orNull(fd: FormData, k: string): string | null {
  const v = str(fd, k);
  return v === "" ? null : v;
}

export async function submitDiagnosis(formData: FormData): Promise<void> {
  // 필수 동의 서버측 재확인 (클라이언트 게이트 우회 방지)
  // 폼은 동의 시에만 제출되지만, 서버에서도 최소 필수값을 검증한다.
  const contactName = str(formData, "contactName");
  const email = str(formData, "email");
  if (!contactName || !email) {
    redirect("/diagnose?error=" + encodeURIComponent("필수 정보를 입력해주세요."));
  }

  // 체크리스트 응답 조립: 각 key 의 checkbox 존재 여부 → boolean
  const answers = { companyName: str(formData, "companyName") } as ChecklistAnswers;
  for (const g of CHECKLIST_GROUPS) {
    for (const it of g.items) {
      (answers as Record<string, unknown>)[it.key] = formData.get(it.key) != null;
    }
  }

  // 회원 세션이면 member_id 연결
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const input: DiagnoseInput = {
    contact: {
      contactName,
      companyName: str(formData, "companyName"),
      email,
      phone: str(formData, "phone"),
      homepageUrl: orNull(formData, "homepageUrl"),
      smartStoreUrl: orNull(formData, "smartStoreUrl"),
      instagramUrl: orNull(formData, "instagramUrl"),
    },
    product: {
      productName: str(formData, "productName"),
      productCategory: str(formData, "productCategory"),
      targetCountries: formData.getAll("targetCountries").map(String),
    },
    answers,
    consentedAt: new Date().toISOString(),
    memberId: user?.id ?? null,
  };

  const result = generateDiagnosis(answers);
  const row = toRow(input, result);

  // 쓰기는 서비스롤(RLS 우회)
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("export_diagnosis_requests")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    redirect("/diagnose?error=" + encodeURIComponent("제출 중 오류가 발생했습니다. 다시 시도해주세요."));
  }

  redirect(`/diagnose/result/${data!.id}`);
}
```

- [ ] **Step 2: 타입체크 통과 확인 (Task 5 포함)**

Run: `cd web && npx tsc --noEmit`
Expected: 에러 없음(Task 5 폼의 `submitDiagnosis` import 해결됨).

- [ ] **Step 3: 커밋**

```bash
git add "web/app/(public)/diagnose/actions.ts"
git commit -m "feat(diagnose): submit server action (insert + diagnose + member link)"
```

---

## Task 7: 결과 화면 + 비회원 가입/상담 신청

저장된 진단 결과를 읽어 종합점수·4영역·우선과제·EU현황·요약·상담 CTA 를 렌더한다. 비회원이면 비밀번호 설정으로 가입(필수 동의)해 결과를 계정에 연결한다.

**Files:**
- Create: `web/app/(public)/diagnose/result/[id]/page.tsx`
- Create: `web/app/(public)/diagnose/result/[id]/ResultActions.tsx`
- Modify: `web/app/(public)/diagnose/actions.ts` (Task 6) — `requestConsultation`, `signUpAndLink` 추가.

**Interfaces:**
- Consumes: `DiagnosisResult` (Task 2); `createServiceClient`, `createClient`.
- Produces:
  - Server: 결과 페이지가 `export_diagnosis_requests` 에서 `diagnosis_result`·`member_id`·`email` 조회.
  - `export async function requestConsultation(id: string): Promise<void>` (actions.ts) — `consultation_requested=true`, `diagnosis_status='consulting_needed'`.
  - `export async function signUpAndLink(formData: FormData): Promise<void>` (actions.ts) — Supabase Auth 가입 후 해당 진단행 `member_id` 를 새 uid 로 연결.

- [ ] **Step 1: actions.ts 에 상담·가입 연결 액션 추가**

```ts
// web/app/(public)/diagnose/actions.ts 에 이어서 추가

export async function requestConsultation(id: string): Promise<void> {
  const admin = createServiceClient();
  await admin
    .from("export_diagnosis_requests")
    .update({
      consultation_requested: true,
      consultation_requested_at: new Date().toISOString(),
      diagnosis_status: "consulting_needed",
    })
    .eq("id", id);
  redirect(`/diagnose/result/${id}?consulted=1`);
}

export async function signUpAndLink(formData: FormData): Promise<void> {
  const diagnosisId = str(formData, "diagnosisId");
  const email = str(formData, "email");
  const password = str(formData, "password");
  const companyName = str(formData, "companyName");
  const contactName = str(formData, "contactName");
  const phone = str(formData, "phone");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: contactName, company_name: companyName, phone } },
  });
  if (error || !data.user) {
    redirect(`/diagnose/result/${diagnosisId}?error=` + encodeURIComponent(error?.message ?? "가입 실패"));
  }

  // 비회원 진단행을 새 uid 로 원자적 연결 (member_id 가 아직 null 인 행만)
  const admin = createServiceClient();
  await admin
    .from("export_diagnosis_requests")
    .update({ member_id: data!.user!.id })
    .eq("id", diagnosisId)
    .is("member_id", null);

  redirect("/mypage");
}
```

- [ ] **Step 2: 결과 페이지(서버 컴포넌트) 작성**

```tsx
// web/app/(public)/diagnose/result/[id]/page.tsx
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { DiagnosisResult } from "@/lib/services/diagnosis/types";
import ResultActions from "./ResultActions";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createServiceClient();
  const { data: row } = await admin
    .from("export_diagnosis_requests")
    .select("id, email, contact_name, company_name, phone, member_id, diagnosis_result")
    .eq("id", id)
    .single();

  if (!row || !row.diagnosis_result) {
    return <main style={{ padding: 24 }}>진단 결과를 찾을 수 없습니다.</main>;
  }
  const r = row.diagnosis_result as DiagnosisResult;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLinkedMember = !!row.member_id;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>
        수출 준비도 {r.overallScore}점 · {r.readinessLevel}
      </h1>
      <p>{r.summary}</p>

      <h2>영역별 점수</h2>
      <ul>
        {Object.values(r.sections).map((s) => (
          <li key={s.label}>
            <strong>
              {s.label}: {s.score}점
            </strong>
            {s.gaps.length > 0 && <span> — 부족: {s.gaps.join(", ")}</span>}
          </li>
        ))}
      </ul>

      <h2>가장 먼저 해결할 과제</h2>
      <ol>
        {r.priorities.map((p) => (
          <li key={p.label}>
            <strong>{p.label}</strong> — {p.note}
          </li>
        ))}
      </ol>

      <h2>EU 필수요건 현황</h2>
      <p>
        보유 {r.euStatus.haveCount}/{r.euStatus.total}
        {r.euStatus.missing.length > 0 && <> · 미비: {r.euStatus.missing.join(", ")}</>}
      </p>

      {/* 전환 훅 + 비회원 가입 */}
      <ResultActions
        diagnosisId={row.id as string}
        pitch={r.consultingNeed.pitch}
        showSignup={!user && !isLinkedMember}
        prefill={{
          email: row.email as string,
          contactName: row.contact_name as string,
          companyName: row.company_name as string,
          phone: row.phone as string,
        }}
      />
    </main>
  );
}
```

- [ ] **Step 3: 결과 액션 클라이언트 컴포넌트 작성**

```tsx
// web/app/(public)/diagnose/result/[id]/ResultActions.tsx
"use client";

import { useState } from "react";
import { requestConsultation, signUpAndLink } from "../../actions";

interface Prefill {
  email: string;
  contactName: string;
  companyName: string;
  phone: string;
}

export default function ResultActions({
  diagnosisId,
  pitch,
  showSignup,
  prefill,
}: {
  diagnosisId: string;
  pitch: string;
  showSignup: boolean;
  prefill: Prefill;
}) {
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  return (
    <section style={{ marginTop: 32 }}>
      <div style={{ padding: 16, background: "rgba(0,102,204,0.06)", borderRadius: 12 }}>
        <p>{pitch}</p>
        <form action={requestConsultation.bind(null, diagnosisId)}>
          <button type="submit">무료 상담 신청</button>
        </form>
      </div>

      {showSignup && (
        <div style={{ marginTop: 24 }}>
          <h3>이 결과를 내 페이지에 저장하세요.</h3>
          <form
            action={(fd) => {
              setError("");
              if (!consent) {
                setError("개인정보 수집 및 이용에 동의해주세요.");
                return;
              }
              signUpAndLink(fd);
            }}
          >
            <input type="hidden" name="diagnosisId" value={diagnosisId} />
            <input type="hidden" name="email" value={prefill.email} />
            <input type="hidden" name="contactName" value={prefill.contactName} />
            <input type="hidden" name="companyName" value={prefill.companyName} />
            <input type="hidden" name="phone" value={prefill.phone} />
            <input name="password" type="password" placeholder="비밀번호 (8자 이상)" minLength={8} required />
            <label style={{ display: "flex", gap: 9, marginTop: 12, fontWeight: 600 }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              개인정보 수집 및 이용에 동의합니다. *
            </label>
            <p style={{ fontSize: 12.5, color: "#6e6e73", marginTop: 8 }}>
              가입 시 BridgeX의 <a href="/terms" target="_blank" rel="noopener">이용약관</a> 및{" "}
              <a href="/privacy" target="_blank" rel="noopener">개인정보처리방침</a>에 동의하게 됩니다.
            </p>
            {error && <p style={{ color: "#d64545", fontWeight: 600 }}>{error}</p>}
            <button type="submit">가입하고 결과 저장</button>
          </form>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: 타입체크 + 전체 테스트**

Run: `cd web && npx tsc --noEmit && npm test`
Expected: 타입 에러 없음, 모든 단위 테스트 PASS.

- [ ] **Step 5: 커밋**

```bash
git add "web/app/(public)/diagnose/result" "web/app/(public)/diagnose/actions.ts"
git commit -m "feat(diagnose): result screen + consultation + non-member signup link"
```

---

## Task 8: 제출 E2E 스모크

로컬/스테이징 Supabase 대상으로 서비스롤 삽입→진단→행 저장을 검증한다. P1 의 `scripts/smoke-auth.mjs` 패턴을 따른다.

**Files:**
- Create: `web/scripts/smoke-diagnose.mjs`
- Modify: `web/package.json` (scripts 에 `smoke:diagnose` 추가)

**Interfaces:**
- Consumes: env `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 1: 스모크 스크립트 작성**

```js
// web/scripts/smoke-diagnose.mjs
// 서비스롤로 export_diagnosis_requests 삽입/조회/삭제 왕복을 검증한다.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("env NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const row = {
  contact_name: "스모크",
  company_name: "스모크컴퍼니",
  email: "smoke@example.com",
  phone: "010-0000-0000",
  product_name: "스모크크림",
  product_category: "스킨케어",
  target_countries: ["독일"],
  checklist_answers: { euRp: true, companyName: "스모크컴퍼니" },
  eu_compliance_readiness: ["EU 책임자(Responsible Person) 지정"],
  is_selling_in_korea: "판매 중",
  export_experience: "없음",
  has_existing_buyer: "없음",
  diagnosis_status: "submitted",
  diagnosis_result: { isBasic: true, overallScore: 42, readinessLevel: "준비 필요" },
};

const { data, error } = await db.from("export_diagnosis_requests").insert(row).select("id").single();
if (error) {
  console.error("INSERT 실패:", error.message);
  process.exit(1);
}
console.log("INSERT ok:", data.id);

const { data: got, error: getErr } = await db
  .from("export_diagnosis_requests")
  .select("id, diagnosis_result, checklist_answers")
  .eq("id", data.id)
  .single();
if (getErr || got.diagnosis_result.overallScore !== 42) {
  console.error("SELECT 검증 실패");
  process.exit(1);
}
console.log("SELECT ok, score:", got.diagnosis_result.overallScore);

await db.from("export_diagnosis_requests").delete().eq("id", data.id);
console.log("cleanup ok — smoke:diagnose PASS");
```

- [ ] **Step 2: package.json 스크립트 추가**

`web/package.json` 의 `"scripts"` 에 추가:

```json
"smoke:diagnose": "node scripts/smoke-diagnose.mjs"
```

- [ ] **Step 3: 스모크 실행 (Supabase 자격증명 주입 후)**

Run: `cd web && npm run smoke:diagnose`
Expected: `INSERT ok` → `SELECT ok, score: 42` → `cleanup ok — smoke:diagnose PASS`.
(자격증명 미주입 환경이면 이 단계는 배포/스테이징에서 실행하고 결과를 기록한다.)

- [ ] **Step 4: 커밋**

```bash
git add web/scripts/smoke-diagnose.mjs web/package.json
git commit -m "test(diagnose): submit->store E2E smoke script"
```

---

## Verification (플랜 완료 기준)

- [ ] `cd web && npm test` — Task 3·4 단위 테스트 전부 PASS.
- [ ] `cd web && npx tsc --noEmit` — 타입 에러 없음.
- [ ] `cd web && npm run smoke:diagnose` — 제출→저장 왕복 PASS(자격증명 주입 환경).
- [ ] 브라우저 수동 확인: `/diagnose` 진입 → 체크리스트 제출(동의 미체크 시 차단 확인) → 결과 화면 점수·우선과제·EU현황 렌더 → 비회원 가입으로 결과 계정 연결 → `/mypage` 에서 재열람.
- [ ] verification-before-completion 스킬로 실제 동작 확인 후 완료 선언.

---

## Self-Review 결과 (작성자 점검)

- **Spec coverage**: 체크리스트 문항(Task 1)·채점 매핑(Task 3)·결과 구조 계승(Task 3,7)·동의 게이트 2지점(Task 5,7)·데이터 모델/마이그레이션(Task 4)·2개 유입 유지(Task 5 프리필, Task 7 비회원 가입)·테스트 전략(Task 3,4,8) — 스펙 각 절이 태스크로 매핑됨.
- **의도적 편차 명시**: PPWR 중간값(40) 미표현→20 처리, 영업 +15 신호를 Offer Sheet 로 대체, Follow-up −15 를 박람회 경험 없음으로 대체, recommendedTopics 파생 — Task 3 서두에 근거와 함께 기록.
- **Placeholder 스캔**: TBD/TODO 없음. 모든 코드 단계에 실제 코드 포함.
- **타입 일관성**: `ChecklistKey`(Task1) → `ChecklistAnswers`(Task2) → 엔진/매핑(Task3,4) → 폼/액션(Task5,6,7) 키·시그니처 일치. `generateDiagnosis`/`toRow`/`submitDiagnosis`/`requestConsultation`/`signUpAndLink` 명칭 태스크 간 동일.

## 오픈 이슈 / 실행 주의

- **P1 의존**: `web/` 스캐폴드·`0001_init.sql`·Auth·`@/lib/supabase/*` 존재가 전제. P1 미완이면 착수 금지. P1 이 스키마를 추가 변경하면 Task 4 마이그레이션과 Task 6 삽입 컬럼을 재확인.
- **공유 체크아웃 주의**: 현재 폴더가 P1 에이전트와 공유될 수 있음 → 격리 워크트리에서 실행.
- **라우트 그룹**: `(public)` 그룹에 layout/공통 셸이 이미 있으면 그 컨벤션에 맞춰 배치. 없으면 P1 의 `app/` 배치 방식을 따른다.
- **동의 서버측 강제**: Task 6 은 클라이언트 게이트를 신뢰하되 필수값(이름·이메일)만 서버 재검증한다. 동의 자체를 서버 필드로 강제하려면 폼에 hidden `consent` 를 실어 서버에서 확인하는 방식으로 확장 가능(현 범위는 클라이언트 게이트 유지).
- **스타일링**: UI 태스크는 구조·동작 중심의 최소 스타일. 프로덕션 비주얼은 구 `diagnose.html` 스타일 이식으로 별도 후속.
