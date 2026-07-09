# BridgeX P1 — Vercel + Supabase 기반(Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vercel에 실제 배포되는 빈 Next.js 앱을 만들고, Supabase Postgres 스키마·RLS·Auth를 연결해 회원가입/로그인/로그아웃과 관리자(is_admin) 게이트가 동작하게 한다.

**Architecture:** Next.js(App Router, TypeScript) 앱을 `web/` 서브폴더에 스캐폴드한다. Supabase를 Postgres·Auth·Storage로 쓰되, 데이터 접근은 **서버 중심** — 서버 코드가 서비스 롤 키로 DB를 다루고 RLS는 2차 방어선이다. 회원 인증은 `@supabase/ssr`로 쿠키 세션을 관리하고, 관리자는 Supabase 유저 + `profiles.is_admin`으로 구분한다.

**Tech Stack:** Next.js 15(App Router), TypeScript, `@supabase/ssr`, `@supabase/supabase-js`, Vitest(단위 테스트), Vercel(호스팅), Supabase(Postgres/Auth/Storage).

## Global Constraints

- 언어는 **TypeScript**. Next.js **App Router**만 사용(Pages Router 금지).
- Next.js 앱 루트는 리포지토리의 **`web/`** 서브폴더. Vercel "Root Directory" = `web`.
- 데이터 접근은 **서버 중심**: 브라우저는 anon 키만, 서버는 `SUPABASE_SERVICE_ROLE_KEY`(서버 전용 env)로 RLS 우회. **서비스 롤 키는 절대 클라이언트 번들/`NEXT_PUBLIC_*`에 넣지 않는다.**
- 스키마 필드 표기는 Postgres 관례인 **snake_case**. 배열은 `text[]`, 객체/자유형은 `jsonb`(스펙의 "네이티브 타입 승격").
- 관리자 = Supabase 유저 + `profiles.is_admin = true`. 관리자 라우트는 서버에서 세션+is_admin 검증, 실패 시 리다이렉트.
- 기존 `backend/`(Express)와 루트 HTML은 P1에서 **건드리지 않는다**(P5에서 제거). `web/`만 추가한다.
- 커밋은 자주. 각 Task 끝에 커밋.
- 브랜치: `feature/vercel-supabase-p1`.

---

## File Structure

P1에서 생성/수정하는 파일 (전부 `web/` 하위, 명시된 것 제외):

- `web/package.json`, `web/tsconfig.json`, `web/next.config.ts`, `web/.gitignore` — Next.js 앱 설정
- `web/.env.example`, `web/.env.local`(gitignore) — 환경변수 (Supabase URL/anon/service-role)
- `web/vitest.config.ts` — 단위 테스트 러너
- `web/app/layout.tsx`, `web/app/page.tsx` — 루트 레이아웃 + 랜딩 플레이스홀더
- `web/app/login/page.tsx`, `web/app/signup/page.tsx` — 인증 화면
- `web/app/(admin)/admin/page.tsx` — 관리자 플레이스홀더(게이트 뒤)
- `web/app/auth/actions.ts` — 서버 액션(signup/login/logout)
- `web/lib/supabase/server.ts` — 서버 컴포넌트/액션용 쿠키 클라이언트
- `web/lib/supabase/service.ts` — 서비스 롤 클라이언트(RLS 우회, 서버 전용)
- `web/lib/supabase/client.ts` — 브라우저 클라이언트
- `web/lib/supabase/middleware.ts` + `web/middleware.ts` — 세션 갱신 미들웨어
- `web/lib/auth/access.ts` — `resolveAccess()` 순수 함수 (권한 판정)
- `web/lib/auth/requireAdmin.ts` — 관리자 게이트 서버 헬퍼
- `web/lib/auth/access.test.ts` — resolveAccess 단위 테스트
- `web/supabase/migrations/0001_init.sql` — 스키마 + RLS + 트리거
- `web/scripts/smoke-auth.mjs` — 실제 Supabase 대상 인증 스모크
- `web/README.md` — 설정/배포 런북

각 파일은 단일 책임을 갖는다. Supabase 클라이언트는 컨텍스트(server/service/client)별로 파일을 분리한다.

---

## Task 0: 브랜치 생성

**Files:** (git only)

- [ ] **Step 1: feature 브랜치 생성**

Run:
```bash
git checkout -b feature/vercel-supabase-p1
```
Expected: `Switched to a new branch 'feature/vercel-supabase-p1'`

---

## Task 1: Next.js 스캐폴드 + 테스트 러너

`web/`에 최소 Next.js(App Router, TS) 앱을 만들고 빌드가 통과하며 Vitest가 도는 상태를 만든다.

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/next.config.ts`, `web/.gitignore`, `web/vitest.config.ts`
- Create: `web/app/layout.tsx`, `web/app/page.tsx`
- Create: `web/.env.example`

**Interfaces:**
- Produces: `web/` Next.js 앱(빌드 가능). 이후 모든 Task가 이 앱에 파일을 추가한다.

- [ ] **Step 1: `web/package.json` 작성**

```json
{
  "name": "bridgex-web",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "smoke:auth": "node scripts/smoke-auth.mjs"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.47.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: `web/tsconfig.json` 작성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: `web/next.config.ts` 작성**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: `web/.gitignore` 작성**

```gitignore
/node_modules
/.next
/out
next-env.d.ts
.env.local
.env*.local
*.tsbuildinfo
```

- [ ] **Step 5: `web/vitest.config.ts` 작성**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 6: `web/app/layout.tsx` 작성**

```tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "BridgeX",
  description: "K-뷰티 유럽 수출 지원",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: `web/app/page.tsx` 작성 (랜딩 플레이스홀더)**

```tsx
export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>BridgeX</h1>
      <p>K-뷰티 유럽 수출 지원 — 기반 마이그레이션(P1) 배포 확인용 플레이스홀더.</p>
      <p>
        <a href="/login">로그인</a> · <a href="/signup">회원가입</a>
      </p>
    </main>
  );
}
```

- [ ] **Step 8: `web/.env.example` 작성**

```bash
# Supabase (프로젝트 대시보드 > Settings > API 에서 복사)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
# 서버 전용 — 절대 클라이언트에 노출 금지, NEXT_PUBLIC_ 접두어 붙이지 말 것
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
```

- [ ] **Step 9: 의존성 설치 후 빌드가 통과하는지 확인**

Run:
```bash
cd web && npm install && npm run build
```
Expected: `npm install` 성공 후 `next build`가 `✓ Compiled successfully` 로 종료(경고는 허용, 에러 없음). `/` 라우트가 정적 생성됨.

- [ ] **Step 10: 커밋**

```bash
git add web/package.json web/package-lock.json web/tsconfig.json web/next.config.ts web/.gitignore web/vitest.config.ts web/app/layout.tsx web/app/page.tsx web/.env.example
git commit -m "feat(web): scaffold Next.js App Router app in web/"
```

---

## Task 2: Supabase 스키마 + RLS + 트리거 마이그레이션

스펙의 데이터 모델을 Postgres DDL로 작성한다. 이 Task의 산출물은 SQL 파일이며, 실제 적용은 Task 6 런북에서 사용자의 Supabase 프로젝트에 대해 수행한다.

**Files:**
- Create: `web/supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: `public.profiles`, `public.export_diagnosis_requests` 테이블 + RLS 정책 + 신규가입 프로필 생성 트리거 + updated_at 트리거.

- [ ] **Step 1: `web/supabase/migrations/0001_init.sql` 작성**

```sql
-- BridgeX P1 초기 스키마 (Postgres / Supabase)
-- 스펙: docs/superpowers/specs/2026-07-09-vercel-supabase-migration-design.md

-- ── profiles: Supabase auth.users 와 1:1 ──────────────────────────────
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text not null default '',
  company_name     text not null default '',
  phone            text not null default '',
  is_admin         boolean not null default false,
  roadmap_progress jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  last_login_at    timestamptz
);

-- ── export_diagnosis_requests ────────────────────────────────────────
create table public.export_diagnosis_requests (
  id                            uuid primary key default gen_random_uuid(),
  -- Step 1. 기본 정보
  contact_name                  text not null,
  company_name                  text not null,
  position                      text,
  email                         text not null,
  phone                         text not null,
  homepage_url                  text,
  smart_store_url               text,
  instagram_url                 text,
  annual_revenue_range          text,
  -- Step 2. 제품 정보
  product_name                  text not null,
  product_category              text not null,
  product_files                 jsonb not null default '[]'::jsonb,
  has_inci                      text not null,
  volume_and_price_range        text,
  is_selling_in_korea           text not null,
  monthly_sales_or_best_seller  text,
  certifications                text[] not null default '{}',
  eu_compliance_readiness       text[] not null default '{}',
  packaging_readiness           text[] not null default '{}',
  -- Step 3. 수출 목표 및 현재 상태
  target_countries              text[] not null default '{}',
  preferred_channels            text[] not null default '{}',
  export_experience             text not null,
  trade_fair_experience         text,
  has_existing_buyer            text not null,
  pain_points                   text[] not null default '{}',
  -- Step 4. 진단 상태
  diagnosis_status              text not null default 'submitted',
  diagnosis_result              jsonb,
  admin_memo                    text,
  -- 상담 신청 (훅 → 컨설팅 전환)
  consultation_requested        boolean not null default false,
  consultation_requested_at     timestamptz,
  -- 컨설팅 진행 트랙 (관리자)
  consulting_stage              text,
  consulting_checklist          jsonb,
  consulting_notes              text,
  meetings                      jsonb not null default '[]'::jsonb,
  -- 회원 연결 (비회원 제출은 null)
  member_id                     uuid references public.profiles(id) on delete set null,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  submitted_at                  timestamptz
);

create index edr_diagnosis_status_idx on public.export_diagnosis_requests (diagnosis_status);
create index edr_product_category_idx on public.export_diagnosis_requests (product_category);
create index edr_submitted_at_idx     on public.export_diagnosis_requests (submitted_at);
create index edr_member_id_idx        on public.export_diagnosis_requests (member_id);

-- ── 신규 가입 시 profiles 자동 생성 트리거 ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, company_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ── updated_at 자동 갱신 트리거 ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger edr_set_updated_at
before update on public.export_diagnosis_requests
for each row execute function public.set_updated_at();

-- ── RLS: 회원은 자기 데이터만. 쓰기·관리자 조회는 서버(서비스 롤)가 우회 ──
alter table public.profiles enable row level security;
alter table public.export_diagnosis_requests enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

create policy edr_select_own on public.export_diagnosis_requests
  for select using (auth.uid() = member_id);
```

- [ ] **Step 2: SQL 문법 자체 점검(로컬 파서)**

Run:
```bash
node -e "const s=require('fs').readFileSync('web/supabase/migrations/0001_init.sql','utf8'); const o=(s.match(/\(/g)||[]).length, c=(s.match(/\)/g)||[]).length; if(o!==c){throw new Error('괄호 불일치 '+o+'/'+c)} if(!/create table public\.profiles/.test(s)||!/create table public\.export_diagnosis_requests/.test(s)){throw new Error('테이블 정의 누락')} console.log('OK: 괄호 '+o+'쌍, 두 테이블 정의 확인')"
```
Expected: `OK: 괄호 N쌍, 두 테이블 정의 확인` (실제 스키마 적용/검증은 Task 6에서 Supabase 대상 수행)

- [ ] **Step 3: 커밋**

```bash
git add web/supabase/migrations/0001_init.sql
git commit -m "feat(web): add Supabase schema, RLS, and signup trigger migration"
```

---

## Task 3: Supabase 클라이언트 3종 + 세션 미들웨어

컨텍스트별 Supabase 클라이언트를 분리해 만들고, 요청마다 세션을 갱신하는 미들웨어를 붙인다.

**Files:**
- Create: `web/lib/supabase/server.ts`, `web/lib/supabase/service.ts`, `web/lib/supabase/client.ts`
- Create: `web/lib/supabase/middleware.ts`, `web/middleware.ts`

**Interfaces:**
- Produces:
  - `createClient(): Promise<SupabaseClient>` from `lib/supabase/server.ts` — 쿠키 기반 서버 클라이언트(anon 키, RLS 적용)
  - `createServiceClient(): SupabaseClient` from `lib/supabase/service.ts` — 서비스 롤(RLS 우회), 서버 전용
  - `createClient(): SupabaseClient` from `lib/supabase/client.ts` — 브라우저(anon 키)
  - `updateSession(request): Promise<NextResponse>` from `lib/supabase/middleware.ts`

- [ ] **Step 1: `web/lib/supabase/server.ts` 작성**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출되면 무시 (미들웨어가 세션 갱신 담당)
          }
        },
      },
    }
  );
}
```

- [ ] **Step 2: `web/lib/supabase/service.ts` 작성**

```ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 서버 전용. 서비스 롤 키로 RLS 를 우회한다. 절대 클라이언트에서 import 하지 말 것.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
```

- [ ] **Step 3: `web/lib/supabase/client.ts` 작성**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: `web/lib/supabase/middleware.ts` 작성**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
        setAll(cookiesToSet) {
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

  // 세션 갱신을 트리거 (반환값은 사용하지 않음)
  await supabase.auth.getUser();
  return response;
}
```

- [ ] **Step 5: `web/middleware.ts` 작성**

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 6: 타입 체크/빌드 통과 확인**

Run:
```bash
cd web && npm run build
```
Expected: `✓ Compiled successfully` — 타입 에러 없음. (env 미설정이어도 빌드는 통과: 런타임에만 값 필요)

- [ ] **Step 7: 커밋**

```bash
git add web/lib/supabase web/middleware.ts
git commit -m "feat(web): add Supabase server/service/browser clients + session middleware"
```

---

## Task 4: 권한 판정 순수 함수 + 관리자 게이트

권한 판정을 순수 함수로 뽑아 TDD로 검증하고, 그 위에 서버 게이트 헬퍼를 얹는다.

**Files:**
- Create: `web/lib/auth/access.ts`, `web/lib/auth/access.test.ts`
- Create: `web/lib/auth/requireAdmin.ts`

**Interfaces:**
- Consumes: `createClient` (server.ts), `createServiceClient` (service.ts)
- Produces:
  - `type Access = "admin" | "member" | "anon"`
  - `resolveAccess(user: { id: string } | null, profile: { is_admin: boolean } | null): Access`
  - `getAccess(): Promise<{ access: Access; userId: string | null }>` — 현재 요청의 권한 조회
  - `requireAdmin(): Promise<void>` — 관리자 아니면 `/login` 으로 redirect

- [ ] **Step 1: 실패하는 테스트 작성 — `web/lib/auth/access.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { resolveAccess } from "./access";

describe("resolveAccess", () => {
  it("returns anon when there is no user", () => {
    expect(resolveAccess(null, null)).toBe("anon");
  });

  it("returns admin when profile.is_admin is true", () => {
    expect(resolveAccess({ id: "u1" }, { is_admin: true })).toBe("admin");
  });

  it("returns member when user exists but is not admin", () => {
    expect(resolveAccess({ id: "u1" }, { is_admin: false })).toBe("member");
  });

  it("returns member when user exists but profile is missing", () => {
    expect(resolveAccess({ id: "u1" }, null)).toBe("member");
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run:
```bash
cd web && npm test
```
Expected: FAIL — `Failed to resolve import "./access"` 또는 `resolveAccess is not a function`.

- [ ] **Step 3: `web/lib/auth/access.ts` 작성 (순수 함수)**

```ts
export type Access = "admin" | "member" | "anon";

export function resolveAccess(
  user: { id: string } | null,
  profile: { is_admin: boolean } | null
): Access {
  if (!user) return "anon";
  if (profile?.is_admin) return "admin";
  return "member";
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run:
```bash
cd web && npm test
```
Expected: PASS — 4 tests passed.

- [ ] **Step 5: `web/lib/auth/access.ts` 에 요청 스코프 헬퍼 `getAccess` 추가**

`web/lib/auth/access.ts` 하단에 append:

```ts
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function getAccess(): Promise<{
  access: Access;
  userId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { access: "anon", userId: null };

  // is_admin 은 서버(서비스 롤)로 조회 — RLS 우회, 신뢰 가능한 판정
  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return { access: resolveAccess(user, profile), userId: user.id };
}
```

- [ ] **Step 6: `web/lib/auth/requireAdmin.ts` 작성**

```ts
import { redirect } from "next/navigation";
import { getAccess } from "@/lib/auth/access";

export async function requireAdmin(): Promise<void> {
  const { access } = await getAccess();
  if (access !== "admin") redirect("/login");
}
```

- [ ] **Step 7: 빌드 + 테스트 통과 확인**

Run:
```bash
cd web && npm run build && npm test
```
Expected: 빌드 `✓ Compiled successfully`, 테스트 4 passed.

- [ ] **Step 8: 커밋**

```bash
git add web/lib/auth
git commit -m "feat(web): add access resolution (tested) + admin gate helper"
```

---

## Task 5: 인증 서버 액션 + 로그인/회원가입/관리자 화면

Supabase Auth로 signup/login/logout을 처리하는 서버 액션과 화면, 게이트가 걸린 관리자 플레이스홀더를 만든다.

**Files:**
- Create: `web/app/auth/actions.ts`
- Create: `web/app/login/page.tsx`, `web/app/signup/page.tsx`
- Create: `web/app/(admin)/admin/page.tsx`

**Interfaces:**
- Consumes: `createClient` (server.ts), `requireAdmin` (requireAdmin.ts)
- Produces (server actions): `signUp(formData: FormData)`, `signIn(formData: FormData)`, `signOut()`

- [ ] **Step 1: `web/app/auth/actions.ts` 작성**

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: String(formData.get("name") ?? ""),
        company_name: String(formData.get("company_name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
      },
    },
  });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  redirect("/mypage");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/mypage");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

> 참고: `/mypage` 는 P2에서 만든다. P1에서는 로그인 후 이 경로로 리다이렉트되며 404여도 무방(인증 성공 자체가 검증 대상). 관리자 게이트 검증은 `/admin` 으로 한다.

- [ ] **Step 2: `web/app/login/page.tsx` 작성**

```tsx
import { signIn } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 360 }}>
      <h1>로그인</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <form action={signIn} style={{ display: "grid", gap: 8 }}>
        <input name="email" type="email" placeholder="이메일" required />
        <input name="password" type="password" placeholder="비밀번호" required />
        <button type="submit">로그인</button>
      </form>
      <p>
        계정이 없나요? <a href="/signup">회원가입</a>
      </p>
    </main>
  );
}
```

- [ ] **Step 3: `web/app/signup/page.tsx` 작성**

```tsx
import { signUp } from "@/app/auth/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 360 }}>
      <h1>회원가입</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <form action={signUp} style={{ display: "grid", gap: 8 }}>
        <input name="name" placeholder="이름" required />
        <input name="company_name" placeholder="회사명" required />
        <input name="phone" placeholder="전화번호" required />
        <input name="email" type="email" placeholder="이메일" required />
        <input name="password" type="password" placeholder="비밀번호(6자 이상)" required />
        <button type="submit">가입</button>
      </form>
      <p>
        이미 계정이 있나요? <a href="/login">로그인</a>
      </p>
    </main>
  );
}
```

- [ ] **Step 4: `web/app/(admin)/admin/page.tsx` 작성 (게이트 뒤 플레이스홀더)**

```tsx
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { signOut } from "@/app/auth/actions";

export default async function AdminHome() {
  await requireAdmin(); // 관리자 아니면 /login 으로 redirect

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>BridgeX 관리자</h1>
      <p>관리자 게이트 통과. 백오피스는 P4에서 구현.</p>
      <form action={signOut}>
        <button type="submit">로그아웃</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: 빌드 통과 확인**

Run:
```bash
cd web && npm run build
```
Expected: `✓ Compiled successfully` — `/login`, `/signup`, `/admin`, `/` 라우트가 빌드됨. 타입 에러 없음.

- [ ] **Step 6: 커밋**

```bash
git add "web/app/auth/actions.ts" "web/app/login/page.tsx" "web/app/signup/page.tsx" "web/app/(admin)/admin/page.tsx"
git commit -m "feat(web): add Supabase Auth actions, login/signup pages, gated admin placeholder"
```

---

## Task 6: 배포 런북 + 인증 스모크 + 실제 배포 검증

Supabase 프로젝트 연결·마이그레이션 적용·관리자 시드·Vercel 배포를 문서화하고, 실제 Supabase 대상 인증 스모크로 P1 완료 기준을 검증한다.

> 이 Task의 일부 단계는 **사용자의 Supabase/Vercel 계정 자격증명**이 필요하다. 구현자는 코드/스크립트/런북을 완성하고, 자격증명이 필요한 단계는 사용자에게 값을 요청하거나 `!` 명령으로 실행한다.

**Files:**
- Create: `web/scripts/smoke-auth.mjs`
- Create: `web/README.md`

**Interfaces:**
- Consumes: `web/supabase/migrations/0001_init.sql`, 환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

- [ ] **Step 1: `web/scripts/smoke-auth.mjs` 작성**

```js
// 실제 Supabase 프로젝트를 대상으로 P1 인증/스키마를 검증한다.
// 사용: web/.env.local 로드 후 `npm run smoke:auth`
// 필요한 env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// .env.local 을 간단 파싱 (dotenv 의존성 없이)
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !service) {
  console.error("env 누락: NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const anonClient = createClient(url, anon);
const svc = createClient(url, service, { auth: { persistSession: false } });
const email = `smoke+${Date.now()}@bridgex.test`;
const password = "smoke-pass-123";
let ok = true;
const check = (name, cond) => { console.log(`${cond ? "✓" : "✗"} ${name}`); if (!cond) ok = false; };

// 1) 회원가입 → auth 유저 + 트리거로 profiles 생성
const { data: signUp, error: suErr } = await anonClient.auth.signUp({
  email, password,
  options: { data: { name: "스모크", company_name: "테스트상사", phone: "01000000000" } },
});
check("회원가입 성공", !suErr && !!signUp.user);
const uid = signUp.user?.id;

// 2) 트리거가 profiles 행을 만들었는지 (서비스 롤로 조회)
const { data: prof } = await svc.from("profiles").select("*").eq("id", uid).single();
check("가입 트리거가 profiles 생성", !!prof);
check("profiles.name 매핑", prof?.name === "스모크");
check("기본 is_admin=false", prof?.is_admin === false);

// 3) 로그인
const { data: signIn, error: siErr } = await anonClient.auth.signInWithPassword({ email, password });
check("로그인 성공", !siErr && !!signIn.session);

// 4) RLS: 익명(로그인 안 한) 클라이언트는 남의 profiles 를 못 봄
const anon2 = createClient(url, anon);
const { data: leaked } = await anon2.from("profiles").select("*").eq("id", uid);
check("RLS: 비로그인은 profiles 조회 0건", Array.isArray(leaked) && leaked.length === 0);

// 5) is_admin 승격 → resolveAccess 관리자 판정 시나리오
await svc.from("profiles").update({ is_admin: true }).eq("id", uid);
const { data: promoted } = await svc.from("profiles").select("is_admin").eq("id", uid).single();
check("is_admin 승격 반영", promoted?.is_admin === true);

// 정리: 스모크 유저 삭제
if (uid) await svc.auth.admin.deleteUser(uid);

console.log(ok ? "\nSMOKE PASS" : "\nSMOKE FAIL");
process.exit(ok ? 0 : 1);
```

- [ ] **Step 2: `web/README.md` 작성 (설정·배포 런북)**

````markdown
# BridgeX Web (Next.js + Supabase)

Vercel + Supabase 기반 BridgeX 앱. P1 = 기반(인증·스키마·배포).

## 1. Supabase 프로젝트

1. https://supabase.com 에서 새 프로젝트 생성(region: Northeast Asia).
2. SQL Editor 에서 `supabase/migrations/0001_init.sql` 전체를 붙여넣고 실행.
3. Settings > API 에서 다음을 복사해 `.env.local` 작성 (`.env.example` 참고):
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 노출 금지)
4. Authentication > Providers > Email 활성화. 개발 중에는
   Authentication > Settings 에서 "Confirm email" 을 꺼두면 스모크가 바로 로그인 가능.

## 2. 로컬 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 단위 테스트 (resolveAccess)
npm run smoke:auth # 실제 Supabase 대상 인증/스키마 스모크
```

## 3. 관리자 계정 만들기

1. `/signup` 에서 관리자용 계정 가입(예: 대표 이메일).
2. Supabase SQL Editor 에서 승격:
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = '관리자이메일');
   ```
3. `/admin` 접속 → 게이트 통과 확인. 비관리자는 `/login` 으로 리다이렉트.

## 4. Vercel 배포

1. Vercel 에서 이 저장소 import, **Root Directory = `web`** 설정.
2. Environment Variables 에 위 3개(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) 등록.
3. Deploy. 배포 URL 에서 `/`, `/signup`, `/login`, `/admin` 동작 확인.
````

- [ ] **Step 3: 커밋 (코드/문서 산출물)**

```bash
git add web/scripts/smoke-auth.mjs web/README.md
git commit -m "feat(web): add auth smoke script + setup/deploy runbook"
```

- [ ] **Step 4: [사용자 자격증명 필요] Supabase 프로젝트 생성 + 마이그레이션 적용 + env**

README 1번을 따라 Supabase 프로젝트를 만들고, `0001_init.sql` 을 SQL Editor 에서 실행하고, `web/.env.local` 을 채운다. (구현 세션에서는 사용자에게 URL/키를 요청하거나, 사용자가 `!` 로 직접 수행)

Verify: Supabase 대시보드 Table Editor 에 `profiles`, `export_diagnosis_requests` 두 테이블과 RLS "Enabled" 표시.

- [ ] **Step 5: [검증] 인증 스모크 실행**

Run:
```bash
cd web && npm run smoke:auth
```
Expected: 마지막 줄 `SMOKE PASS` — 가입/트리거/로그인/RLS/is_admin 승격 전부 ✓.

- [ ] **Step 6: [사용자 자격증명 필요] Vercel 배포 + 배포 검증**

README 4번을 따라 배포(Root Directory=`web`, env 3개 등록). 배포 URL에서 확인:
- `/` 랜딩 플레이스홀더 렌더
- `/signup` 로 가입 → `/mypage`(404 허용) 로 이동, Supabase Authentication > Users 에 유저 생성
- 그 유저를 SQL로 is_admin 승격 후 `/admin` 접속 → 게이트 통과
- 로그아웃 후 `/admin` 재접속 → `/login` 리다이렉트

Verify(P1 완료 기준): 배포 URL이 살아있고 위 4개 흐름이 모두 동작.

---

## Self-Review (작성자 점검 결과)

**1. 스펙 커버리지:**
- 목표 스택(Next.js/TS/Vercel/Supabase) → Task 1, 6 ✓
- 데이터 모델(jsonb/text[] 승격, profiles↔auth.users, member_id null) → Task 2 ✓
- RLS(회원 자기 행만, 서버 우회) → Task 2 + smoke Step5 ✓
- 인증 흐름(Supabase Auth, 가입 트리거로 profiles 생성) → Task 2 트리거 + Task 5 액션 ✓
- 관리자(Supabase 유저 + is_admin + 게이트) → Task 4, 5 + README 3 ✓
- 서버 중심 데이터 접근(서비스 롤 vs anon 분리) → Task 3 ✓
- P1 완료 기준(배포·로그인·게이트) → Task 6 Step6 ✓
- 비회원 진단 uid 연결 UX → **P2 범위**(본 P1 스코프 아님, 스펙과 일치) ✓

**2. Placeholder 스캔:** "TBD/TODO/이후" 없음. 모든 코드 스텝에 실제 코드 포함. (랜딩/관리자 화면은 의도된 P1 플레이스홀더로 스펙과 일치, 미완성 아님.)

**3. 타입 일관성:** `resolveAccess(user, profile)` 시그니처가 Task 4 정의·테스트·`getAccess` 호출에서 일치. `createClient`(server)와 `createServiceClient`(service) 이름이 Task 3 정의와 Task 4/5 소비에서 일치. 서버 액션 `signUp/signIn/signOut` 이름이 Task 5 정의·화면 소비에서 일치.

**4. 모호성:** env 3종의 노출 경계(anon=클라 허용, service-role=서버 전용)를 Global Constraints + Task 3 주석에 명시.
