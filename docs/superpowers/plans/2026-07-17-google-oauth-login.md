# Google OAuth 로그인/회원가입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 이메일/비밀번호 인증에 Google OAuth 로그인·회원가입을 추가하고, 구글 신규 가입자는 회사명·전화·필수동의를 받는 온보딩을 거쳐 서비스에 진입시킨다.

**Architecture:** `@supabase/ssr` 쿠키 세션과 호환되는 PKCE 리디렉트 방식. "Google로 계속하기" → 서버액션이 `signInWithOAuth`로 구글 동의화면 이동 → `/auth/callback`이 세션을 확립하고 `profiles.onboarded_at`으로 분기(`/onboarding` 또는 `/mypage`). 미들웨어가 로그인+미온보딩 상태를 `/onboarding`으로 게이트한다.

**Tech Stack:** Next.js 15 (App Router, Server Actions), `@supabase/ssr` 0.5.x, `@supabase/supabase-js` 2.x, Supabase Postgres(RLS), Vitest.

## Global Constraints

- 대상 디렉터리는 `web/`. 모든 경로는 `web/` 기준.
- Supabase 클라이언트 생성은 기존 헬퍼만 사용: 서버 컴포넌트/액션 = `@/lib/supabase/server` 의 `createClient()`, RLS 우회 쓰기 = `@/lib/supabase/service` 의 `createServiceClient()`. `service.ts`는 클라이언트에서 절대 import 금지.
- 개인정보 수집·이용 동의는 **필수** 이며 클라이언트 게이트 + 서버 이중 검증을 유지한다(기존 `signUp` 패턴).
- UI는 `web/app/auth.module.css`의 기존 클래스/토큰(`--blue`, `--blue-focus`, `.btn`, `.input` 등)을 재사용하고 톤을 맞춘다.
- Supabase project-ref: `lomjryokqskruzdhieol`. 프로덕션 도메인: `https://bridgexkorea.com`.
- 커밋 메시지는 한국어, 기존 컨벤션(`feat(auth): …`, `docs(auth): …`) 준수.

---

## File Structure

**생성:**
- `web/supabase/migrations/0005_oauth_onboarding.sql` — profiles에 온보딩 컬럼 추가 + 백필
- `web/lib/auth/onboarding.ts` — 순수 판정 헬퍼 `isOnboarded(profile)`
- `web/lib/auth/onboarding.test.ts` — 헬퍼 유닛 테스트
- `web/app/auth/callback/route.ts` — OAuth 콜백(코드→세션 교환, 온보딩 분기)
- `web/app/onboarding/page.tsx` — 온보딩 페이지(서버 컴포넌트)
- `web/app/onboarding/OnboardingForm.tsx` — 온보딩 폼(클라이언트)
- `web/app/onboarding/actions.ts` — `completeOnboarding` 서버액션

**수정:**
- `web/app/auth/actions.ts` — `signInWithGoogle` 추가, `signUp`에 온보딩 스탬프 추가
- `web/app/login/LoginForm.tsx` — Google 버튼 + 구분선
- `web/app/signup/SignupForm.tsx` — Google 버튼 + 구분선
- `web/app/auth.module.css` — `.oauthBtn`, `.divider` 스타일 추가
- `web/lib/supabase/middleware.ts` — 온보딩 게이트
- `web/scripts/smoke-auth.mjs` — 온보딩 컬럼/백필 스모크 체크 추가

---

## Task 1: DB 마이그레이션 — 온보딩 컬럼 + 백필

**Files:**
- Create: `web/supabase/migrations/0005_oauth_onboarding.sql`
- Modify: `web/scripts/smoke-auth.mjs`

**Interfaces:**
- Produces: `public.profiles.onboarded_at timestamptz null`, `public.profiles.consent_agreed_at timestamptz null`. `onboarded_at`이 null이면 온보딩 미완료.

- [ ] **Step 1: 마이그레이션 SQL 작성**

Create `web/supabase/migrations/0005_oauth_onboarding.sql`:

```sql
-- BridgeX 0005: OAuth 온보딩 지원
-- 스펙: docs/superpowers/specs/2026-07-17-google-oauth-login-design.md

-- 온보딩 완료/동의 시각 (null = 미완료)
alter table public.profiles
  add column if not exists onboarded_at      timestamptz,
  add column if not exists consent_agreed_at timestamptz;

-- 기존 회원 백필: 회사명과 전화가 모두 채워진 프로필은 이미 온보딩된 것으로 간주.
-- (기존 이메일 가입 경로는 두 값을 필수로 받았으므로 이 조건이 안전하다.)
update public.profiles
set onboarded_at      = coalesce(onboarded_at, created_at),
    consent_agreed_at = coalesce(consent_agreed_at, created_at)
where onboarded_at is null
  and company_name <> ''
  and phone <> '';
```

- [ ] **Step 2: 원격 프로젝트에 적용**

MCP `apply_migration`(name: `oauth_onboarding`, project_id: `lomjryokqskruzdhieol`)으로 위 SQL을 적용한다. (로컬 CLI가 없으므로 원격 적용)

- [ ] **Step 3: 적용 확인**

MCP `list_tables`(schemas: `["public"]`)로 `profiles`에 `onboarded_at`, `consent_agreed_at` 두 컬럼이 존재하는지 확인.
Expected: 두 컬럼 모두 `timestamptz`, nullable.

- [ ] **Step 4: 스모크 스크립트에 컬럼 체크 추가**

`web/scripts/smoke-auth.mjs`의 3번 블록(로그인 성공) 다음, 5번 블록 이전에 삽입:

```javascript
// 4b) 온보딩 컬럼 존재 + 신규 가입은 온보딩 미완료(onboarded_at null)
const { data: onbCols, error: onbErr } = await svc
  .from("profiles")
  .select("onboarded_at, consent_agreed_at")
  .eq("id", uid)
  .single();
check("profiles 온보딩 컬럼 조회 가능", !onbErr && onbCols !== null);
check("신규 admin.createUser 는 온보딩 미완료(null)", onbCols?.onboarded_at == null);
```

- [ ] **Step 5: 스모크 실행**

Run (in `web/`): `npm run smoke:auth`
Expected: 새 두 체크 포함 `SMOKE PASS`.
(주의: `admin.createUser`는 트리거로 profiles를 만들지만 company/phone은 메타로 채워지고 `onboarded_at`은 null이므로 위 체크가 통과한다. 백필 update는 신규 유저 생성 이후 재실행되지 않으므로 신규 유저는 null 유지.)

- [ ] **Step 6: 커밋**

```bash
git add web/supabase/migrations/0005_oauth_onboarding.sql web/scripts/smoke-auth.mjs
git commit -m "feat(auth): profiles 온보딩 컬럼 추가 + 기존 회원 백필"
```

---

## Task 2: 온보딩 판정 헬퍼 (순수 로직 + 테스트)

**Files:**
- Create: `web/lib/auth/onboarding.ts`
- Test: `web/lib/auth/onboarding.test.ts`

**Interfaces:**
- Produces: `export function isOnboarded(profile: { onboarded_at: string | null } | null): boolean` — profile이 null이거나 `onboarded_at`이 null/빈값이면 `false`, 값이 있으면 `true`.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `web/lib/auth/onboarding.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { isOnboarded } from "./onboarding";

describe("isOnboarded", () => {
  it("returns false when profile is null", () => {
    expect(isOnboarded(null)).toBe(false);
  });
  it("returns false when onboarded_at is null", () => {
    expect(isOnboarded({ onboarded_at: null })).toBe(false);
  });
  it("returns true when onboarded_at has a timestamp", () => {
    expect(isOnboarded({ onboarded_at: "2026-07-17T00:00:00Z" })).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run (in `web/`): `npx vitest run lib/auth/onboarding.test.ts`
Expected: FAIL — `Cannot find module './onboarding'` 또는 `isOnboarded is not a function`.

- [ ] **Step 3: 최소 구현 작성**

Create `web/lib/auth/onboarding.ts`:

```typescript
// 온보딩 완료 여부 판정 (순수). onboarded_at 이 채워졌으면 완료.
export function isOnboarded(
  profile: { onboarded_at: string | null } | null
): boolean {
  return !!profile?.onboarded_at;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run (in `web/`): `npx vitest run lib/auth/onboarding.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
git add web/lib/auth/onboarding.ts web/lib/auth/onboarding.test.ts
git commit -m "feat(auth): 온보딩 완료 판정 헬퍼 isOnboarded"
```

---

## Task 3: OAuth 시작 서버액션 + Google 버튼 UI

**Files:**
- Modify: `web/app/auth/actions.ts`
- Modify: `web/app/auth.module.css`
- Modify: `web/app/login/LoginForm.tsx`
- Modify: `web/app/signup/SignupForm.tsx`

**Interfaces:**
- Produces: `export async function signInWithGoogle(): Promise<void>` — `signInWithOAuth`로 구글 인증 URL을 만들고 그 URL로 `redirect()`. 실패 시 `/login?error=...`로 redirect.
- Consumes: 없음(외부 Supabase Google provider 설정은 Task 8 체크리스트).

- [ ] **Step 1: 서버액션 추가**

`web/app/auth/actions.ts` 상단 import에 `headers`를 추가:

```typescript
import { headers } from "next/headers";
```

그리고 `signOut` 함수 아래에 추가:

```typescript
export async function signInWithGoogle() {
  const supabase = await createClient();
  const hdrs = await headers();
  // 프록시(Vercel) 뒤에서도 올바른 오리진 도출
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data?.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "구글 로그인을 시작할 수 없습니다.")}`);
  }
  redirect(data.url);
}
```

- [ ] **Step 2: CSS 추가**

`web/app/auth.module.css` 맨 끝에 추가:

```css
/* OAuth 버튼 / 구분선 */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 4px;
  color: var(--muted);
  font-size: 12.5px;
}
.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}
.oauthBtn {
  width: 100%;
  height: 50px;
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid #dcdcdc;
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}
.oauthBtn:hover {
  background: #fafafa;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}
.oauthG {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}
```

- [ ] **Step 3: 로그인 화면에 Google 버튼 추가**

`web/app/login/LoginForm.tsx`의 import에 서버액션을 추가:

```typescript
import { signIn, signInWithGoogle } from "@/app/auth/actions";
```

로그인 버튼(`</button>`) 바로 다음, `<div className={styles.switch}>` 앞에 삽입:

```tsx
      <div className={styles.divider}>또는</div>

      <form action={signInWithGoogle}>
        <button type="submit" className={styles.oauthBtn}>
          <svg className={styles.oauthG} viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          Google로 계속하기
        </button>
      </form>
```

(주: 별도 `<form>`으로 감싸 `signInWithGoogle`을 form action으로 호출한다. 바깥 로그인 폼은 클라이언트 `handleSubmit`을 쓰므로 중첩 금지 — 형제로 배치.)

- [ ] **Step 4: 회원가입 화면에 Google 버튼 추가**

`web/app/signup/SignupForm.tsx`의 import에 추가:

```typescript
import { signUp, signInWithGoogle } from "@/app/auth/actions";
```

가입 버튼(`{submitting ? "가입 중…" : "가입하기"}` 버튼의 `</button>`) 다음, `<div className={styles.switch}>` 앞에 삽입(로그인과 동일 마크업):

```tsx
      <div className={styles.divider}>또는</div>

      <form action={signInWithGoogle}>
        <button type="submit" className={styles.oauthBtn}>
          <svg className={styles.oauthG} viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          Google로 계속하기
        </button>
      </form>
```

- [ ] **Step 5: 타입/빌드 확인**

Run (in `web/`): `npx tsc --noEmit`
Expected: 에러 없음.
Run (in `web/`): `npm run build`
Expected: 빌드 성공(콜백 라우트는 아직 없어도 버튼은 URL 없는 provider면 런타임에서만 실패하므로 빌드는 통과).

- [ ] **Step 6: 커밋**

```bash
git add web/app/auth/actions.ts web/app/auth.module.css web/app/login/LoginForm.tsx web/app/signup/SignupForm.tsx
git commit -m "feat(auth): Google OAuth 시작 서버액션 + 로그인/회원가입 버튼"
```

---

## Task 4: OAuth 콜백 라우트

**Files:**
- Create: `web/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `isOnboarded` (Task 2), `createClient` (server), `createServiceClient` (service).
- Produces: `GET /auth/callback` 라우트 핸들러. `code` 교환 성공 시 온보딩 여부에 따라 `/onboarding` 또는 `/mypage`로 리디렉트, 실패 시 `/login?error=...`.

- [ ] **Step 1: 콜백 라우트 작성**

Create `web/app/auth/callback/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOnboarded } from "@/lib/auth/onboarding";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // 프록시 뒤 올바른 오리진
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("인증 코드가 없습니다.")}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // 온보딩 여부로 분기 (서비스 롤로 신뢰 가능한 판정)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("세션 확인에 실패했습니다.")}`
    );
  }
  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .single();

  const dest = isOnboarded(profile) ? "/mypage" : "/onboarding";
  return NextResponse.redirect(`${origin}${dest}`);
}
```

- [ ] **Step 2: 타입/빌드 확인**

Run (in `web/`): `npx tsc --noEmit`
Expected: 에러 없음.
Run (in `web/`): `npm run build`
Expected: 빌드 성공, 라우트 목록에 `/auth/callback` 포함.

- [ ] **Step 3: 커밋**

```bash
git add web/app/auth/callback/route.ts
git commit -m "feat(auth): OAuth 콜백 라우트 (코드 교환 + 온보딩 분기)"
```

---

## Task 5: 온보딩 페이지 + 폼 + 서버액션

**Files:**
- Create: `web/app/onboarding/actions.ts`
- Create: `web/app/onboarding/OnboardingForm.tsx`
- Create: `web/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: `createClient` (server), `createServiceClient` (service), `isOnboarded` (Task 2), `web/app/auth.module.css`.
- Produces: `export async function completeOnboarding(formData: FormData): Promise<void>` — 동의/필수값 검증 후 profiles 업데이트(`company_name`, `phone`, `onboarded_at=now`, `consent_agreed_at=now`), 성공 시 `/mypage`로 redirect.

- [ ] **Step 1: 온보딩 서버액션 작성**

Create `web/app/onboarding/actions.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function completeOnboarding(formData: FormData) {
  // 동의 필수 (서버 이중 검증)
  if (formData.get("consent") !== "on") {
    redirect(
      `/onboarding?error=${encodeURIComponent("개인정보 수집 및 이용에 동의해주세요.")}`
    );
  }
  const company = String(formData.get("company_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!company || !phone) {
    redirect(
      `/onboarding?error=${encodeURIComponent("회사명과 전화번호를 입력해주세요.")}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await svc
    .from("profiles")
    .update({
      company_name: company,
      phone,
      onboarded_at: now,
      consent_agreed_at: now,
    })
    .eq("id", user.id);
  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/mypage");
}
```

- [ ] **Step 2: 온보딩 폼(클라이언트) 작성**

Create `web/app/onboarding/OnboardingForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { completeOnboarding } from "./actions";
import styles from "../auth.module.css";

export default function OnboardingForm({
  serverError,
  defaultCompany,
}: {
  serverError?: string;
  defaultCompany?: string;
}) {
  const [error, setError] = useState(serverError ?? "");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    const company = String(formData.get("company_name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    if (!company || !phone) {
      setError("회사명과 전화번호를 입력해주세요.");
      return;
    }
    if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ""))) {
      setError("전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)");
      return;
    }
    if (!consent) {
      setError("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }
    setSubmitting(true);
    await completeOnboarding(formData); // 성공 시 서버 액션이 redirect
    setSubmitting(false);
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <h1 className={styles.h}>가입 정보를 마저 입력해주세요</h1>
      <p className={styles.sub}>서비스 이용을 위해 아래 정보가 필요합니다.</p>

      <label className={styles.label}>회사명</label>
      <input
        className={styles.input}
        name="company_name"
        autoComplete="organization"
        defaultValue={defaultCompany ?? ""}
        placeholder="브랜드/회사명"
      />

      <label className={styles.label}>전화번호</label>
      <input
        className={styles.input}
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="010-1234-5678"
      />

      <div className={styles.consentBox}>
        <label className={styles.consentCheck}>
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          개인정보 수집 및 이용에 동의합니다. <span className={styles.req}>*</span>
        </label>
        <p className={styles.consentText}>
          제출 시 BridgeX의{" "}
          <a href="/terms" target="_blank" rel="noopener">
            이용약관
          </a>{" "}
          및{" "}
          <a href="/privacy" target="_blank" rel="noopener">
            개인정보처리방침
          </a>
          에 동의하게 됩니다.
        </p>
      </div>

      <div className={styles.err}>{error}</div>

      <button type="submit" className={styles.btn} disabled={submitting}>
        {submitting ? "저장 중…" : "시작하기"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: 온보딩 페이지(서버 컴포넌트) 작성**

Create `web/app/onboarding/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOnboarded } from "@/lib/auth/onboarding";
import OnboardingForm from "./OnboardingForm";
import styles from "../auth.module.css";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("onboarded_at, company_name")
    .eq("id", user.id)
    .single();

  // 이미 온보딩 완료면 마이페이지로
  if (isOnboarded(profile)) redirect("/mypage");

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.brand}>
          Bridge<span>X</span>
        </a>
        <OnboardingForm
          serverError={error}
          defaultCompany={profile?.company_name || ""}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: 타입/빌드 확인**

Run (in `web/`): `npx tsc --noEmit`
Expected: 에러 없음.
Run (in `web/`): `npm run build`
Expected: 빌드 성공, 라우트에 `/onboarding` 포함.

- [ ] **Step 5: 커밋**

```bash
git add web/app/onboarding/actions.ts web/app/onboarding/OnboardingForm.tsx web/app/onboarding/page.tsx
git commit -m "feat(auth): 온보딩 페이지/폼/서버액션 (회사명·전화·동의 수집)"
```

---

## Task 6: 미들웨어 온보딩 게이트

**Files:**
- Modify: `web/lib/supabase/middleware.ts`

**Interfaces:**
- Consumes: `isOnboarded` (Task 2). 미들웨어의 SSR supabase 클라이언트(사용자 권한)로 `profiles` 조회 — RLS `profiles_select_own`이 본인 행 select를 허용.
- Produces: 로그인 O + 미온보딩 + 보호 경로 접근 시 `/onboarding`으로 307 redirect.

- [ ] **Step 1: 미들웨어에 게이트 로직 추가**

`web/lib/supabase/middleware.ts`를 아래로 교체:

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOnboarded } from "@/lib/auth/onboarding";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// 온보딩 게이트에서 제외할 경로 (로그인 없이 접근 가능하거나 온보딩 자체/콜백)
const ONBOARDING_EXEMPT = [
  "/onboarding",
  "/auth/callback",
  "/login",
  "/signup",
  "/terms",
  "/privacy",
  "/diagnose",
];

function isExempt(pathname: string): boolean {
  if (pathname === "/") return true;
  return ONBOARDING_EXEMPT.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 + 사용자 조회
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 온보딩 게이트: 로그인했지만 미온보딩이고 보호 경로면 /onboarding 으로
  const { pathname } = request.nextUrl;
  if (user && !isExempt(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .single();
    if (!isOnboarded(profile)) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
```

- [ ] **Step 2: 타입/빌드 확인**

Run (in `web/`): `npx tsc --noEmit`
Expected: 에러 없음.
Run (in `web/`): `npm run build`
Expected: 빌드 성공.

- [ ] **Step 3: 커밋**

```bash
git add web/lib/supabase/middleware.ts
git commit -m "feat(auth): 미들웨어 온보딩 게이트 (미온보딩 → /onboarding)"
```

---

## Task 7: 이메일 회원가입에 온보딩 스탬프 추가

**Files:**
- Modify: `web/app/auth/actions.ts`

**Interfaces:**
- Consumes: `createServiceClient` (service). 이메일 가입은 폼에서 동의·회사·전화를 이미 받으므로, 가입 성공 시 `onboarded_at`/`consent_agreed_at`을 채워 온보딩 게이트에 걸리지 않게 한다.

- [ ] **Step 1: signUp에 스탬프 로직 추가**

`web/app/auth/actions.ts`의 import에 서비스 클라이언트를 추가:

```typescript
import { createServiceClient } from "@/lib/supabase/service";
```

`signUp` 함수에서 `signUp` 호출 결과 처리 부분을 아래로 교체(에러 처리 다음, 세션 분기 앞):

```typescript
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

  // 이메일 가입은 동의/회사/전화를 폼에서 이미 받았으므로 온보딩 완료로 스탬프.
  // (트리거가 profiles 행을 만든 뒤, 서비스 롤로 온보딩 시각 기록)
  if (data.user) {
    const svc = createServiceClient();
    const now = new Date().toISOString();
    await svc
      .from("profiles")
      .update({ onboarded_at: now, consent_agreed_at: now })
      .eq("id", data.user.id);
  }

  // Confirm email 이 켜져 있으면 세션이 아직 없다 → 확인 메일 안내 화면으로.
  if (!data.session) redirect("/signup?sent=1");
  redirect("/mypage");
```

- [ ] **Step 2: 타입/빌드 확인**

Run (in `web/`): `npx tsc --noEmit`
Expected: 에러 없음.
Run (in `web/`): `npm run build`
Expected: 빌드 성공.

- [ ] **Step 3: 커밋**

```bash
git add web/app/auth/actions.ts
git commit -m "feat(auth): 이메일 가입 시 온보딩 완료 스탬프"
```

---

## Task 8: 외부 설정 + 엔드투엔드 검증

**Files:** (코드 변경 없음 — 외부 설정 및 수동 검증)

**Interfaces:**
- Consumes: Task 1–7 전체.

- [ ] **Step 1: Google Cloud Console OAuth 클라이언트 발급 (대표님 수행)**

- 프로젝트 선택/생성 → **OAuth 동의화면**: 앱 이름 `BridgeX`, 지원 이메일, 승인된 도메인 `bridgexkorea.com`.
- **사용자 인증 정보 → OAuth 클라이언트 ID(웹 애플리케이션)** 생성.
- **승인된 리디렉션 URI**에 추가:
  `https://lomjryokqskruzdhieol.supabase.co/auth/v1/callback`
- 발급된 **Client ID / Client Secret** 확보.

- [ ] **Step 2: Supabase Google provider 활성화 (대표님 수행)**

- Authentication → Providers → **Google** ON, Step 1의 Client ID/Secret 입력.
- Authentication → URL Configuration → **Redirect URLs**에 추가:
  `https://bridgexkorea.com/auth/callback`, `http://localhost:3000/auth/callback`
- **Site URL** = `https://bridgexkorea.com` 확인.
- (선택) Authentication → Providers 설정에서 "동일 이메일 자동 연결"/"확인된 이메일만" 관련 옵션 확인 — 스펙 §8 계정 통합 정책.

- [ ] **Step 3: 로컬 엔드투엔드 검증 (신규 구글 사용자)**

Run (in `web/`): `npm run dev`
브라우저에서 `http://localhost:3000/login` → "Google로 계속하기" → 구글 로그인.
Expected: 콜백 후 `/onboarding`으로 이동. 회사명·전화 입력 + 동의 체크 → "시작하기" → `/mypage` 도착.

- [ ] **Step 4: 재로그인 검증 (온보딩 완료 사용자)**

로그아웃 후 다시 "Google로 계속하기".
Expected: `/onboarding`을 거치지 않고 곧바로 `/mypage`.

- [ ] **Step 5: 게이트 검증 (미온보딩 보호경로 접근)**

새 구글 계정으로 로그인해 온보딩을 완료하지 않은 상태에서 주소창에 `/mypage` 직접 입력.
Expected: `/onboarding`으로 리디렉트.

- [ ] **Step 6: 동의 서버검증**

온보딩 화면에서 (개발자도구로 disabled 우회하거나) 동의 없이 제출 시.
Expected: `/onboarding?error=...` 로 되돌아오고 저장되지 않음.

- [ ] **Step 7: 기존 이메일 회원 회귀 검증**

기존 이메일/비번 회원으로 로그인.
Expected: 백필 덕분에 온보딩 화면에 걸리지 않고 `/mypage` 정상 접근. 신규 이메일 가입도 `/mypage` 직행(Task 7 스탬프).

- [ ] **Step 8: 최종 커밋(문서/스모크 정리) 및 배포**

검증 로그/스크린샷을 확인하고, 필요 시 `web/scripts/smoke-auth.mjs`나 문서를 소폭 보강해 커밋. Vercel에 배포 후 프로덕션 URL로 Step 3–5 재확인.

---

## Self-Review

**Spec coverage:**
- §3 PKCE 리디렉트 → Task 3(시작), Task 4(콜백). ✓
- §4.1 컬럼/백필 → Task 1. ✓
- §4.2 온보딩 페이지 → Task 5. ✓
- §4.3 미들웨어 게이트 → Task 6. ✓
- §5 UI 버튼 → Task 3. ✓
- §6 에러 처리 → Task 3/4/5의 redirect 에러 경로. ✓
- §7 외부 설정 체크리스트 → Task 8 Step 1–2. ✓
- §8 계정 통합 확인 → Task 8 Step 2(확인 포인트). ✓ / 백필 조건 확정 → Task 1 SQL. ✓ / 미들웨어 조회 방식 → Task 6(요청당 본인행 select, RLS 이용)로 확정. ✓
- §9 테스트 관점 → Task 8 Step 3–7 + Task 2 유닛 + Task 1 스모크. ✓
- 이메일 가입 스탬프(신규 회원이 게이트에 걸리지 않도록) → Task 7. ✓

**Placeholder scan:** TBD/TODO 없음. 모든 코드 스텝에 실제 코드 포함.

**Type consistency:** `isOnboarded(profile)` 시그니처가 Task 2 정의와 Task 4/5/6 사용처에서 일치(`{ onboarded_at: string | null } | null`). `completeOnboarding(formData)`·`signInWithGoogle()` 시그니처 일관. profiles 컬럼명(`onboarded_at`, `consent_agreed_at`, `company_name`, `phone`) 전 태스크 일치.
