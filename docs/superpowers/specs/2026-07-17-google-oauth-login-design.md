# Google OAuth 로그인/회원가입 설계

- 작성일: 2026-07-17
- 대상: `web/` (Next.js App Router + `@supabase/ssr`)
- 상태: 승인됨 (구현 플랜 작성 대기)

## 1. 목표

기존 이메일/비밀번호 인증에 더해, **Google 계정으로 회원가입·로그인**을 지원한다.
구글 가입자는 회사명·전화번호·개인정보 동의(필수)를 주지 않으므로, 가입 직후
**보충 온보딩 화면**에서 이를 받은 뒤 서비스에 진입시킨다.

## 2. 범위

### 포함
- 로그인/회원가입 화면에 "Google로 계속하기" 버튼 추가
- 서버액션 `signInWithGoogle()` (OAuth 시작)
- OAuth 콜백 라우트 `web/app/auth/callback/route.ts`
- 온보딩 페이지 `/onboarding` + 서버액션 (회사명·전화·동의 수집)
- `profiles`에 온보딩 완료 플래그 컬럼 추가 (마이그레이션 0005)
- 미들웨어 온보딩 게이트 (로그인 O + 온보딩 X → `/onboarding` 유도)

### 제외 (YAGNI)
- 카카오/네이버 등 다른 소셜 로그인
- 계정 병합 UI (수동 링크 화면). 이메일 기반 자동 연결에 의존
- 온보딩 정보의 관리자 편집 화면

## 3. 인증 플로우 — PKCE 리디렉트

팝업이 아닌 **서버 사이드 리디렉트(PKCE)** 방식. `@supabase/ssr`의 쿠키 기반
세션과 호환되는 표준 방식이다.

```
[로그인/회원가입 화면]
   └ "Google로 계속하기" 클릭
        └ 서버액션 signInWithGoogle()
             supabase.auth.signInWithOAuth({
               provider: 'google',
               options: { redirectTo: `${origin}/auth/callback` }
             })
             → 반환된 data.url 로 redirect()
   └ 구글 동의화면 → 사용자 승인
        └ GET /auth/callback?code=...
             supabase.auth.exchangeCodeForSession(code)  (세션 쿠키 확립)
             ├ profiles.onboarded_at 이 null      → redirect /onboarding
             └ profiles.onboarded_at 이 not null  → redirect /mypage
```

- `origin`은 요청 헤더에서 도출(프로덕션 `https://bridgexkorea.com`, 로컬 `http://localhost:3000`).
- 콜백에서 `code`가 없거나 교환 실패 시 → `/login?error=...`로 리디렉트.

## 4. 온보딩 게이트

### 4.1 데이터 (마이그레이션 `0005_oauth_onboarding.sql`)
`public.profiles`에 컬럼 추가:

| 컬럼 | 타입 | 의미 |
|------|------|------|
| `onboarded_at`      | `timestamptz` (nullable) | 보충 온보딩 완료 시각. null이면 미완료 |
| `consent_agreed_at` | `timestamptz` (nullable) | 개인정보 수집·이용 동의 시각 |

- **기존 이메일 가입자 백필**: 마이그레이션에서 이미 `company_name`/`phone`가 채워진
  (또는 기존 전체) 프로필의 `onboarded_at`을 현재 시각으로 백필하여, 기존 회원이
  온보딩 화면에 걸리지 않게 한다. (구체 조건은 구현 플랜에서 확정)
- 이메일 회원가입 서버액션(`signUp`)은 앞으로 `onboarded_at`/`consent_agreed_at`을
  가입 시점에 기록한다(동의를 이미 폼에서 받으므로). 이 write는 서버(서비스 롤)에서 수행.

### 4.2 온보딩 페이지 `/onboarding`
- 접근: 로그인 상태에서만. 이미 온보딩 완료면 `/mypage`로 리디렉트.
- 필드: 회사명(필수), 전화번호(필수), 개인정보 수집·이용 동의(필수 체크박스).
  이름은 구글 프로필에서 이미 채워졌으면 프리필/표시.
- 제출 서버액션: 동의 미체크 시 에러로 되돌림(클라이언트 게이트 + 서버 이중 검증,
  기존 `signUp` 패턴 준수). 성공 시 `profiles` 업데이트(company_name, phone,
  `onboarded_at=now()`, `consent_agreed_at=now()`) 후 `/mypage`로.

### 4.3 미들웨어 게이트
`web/lib/supabase/middleware.ts`(및 `web/middleware.ts` 매처)에서:
- 로그인 O + `onboarded_at` null + 보호 라우트 접근 시 → `/onboarding`으로 리디렉트.
- 제외 경로: `/onboarding` 자신, `/auth/callback`, 로그아웃, 정적 자원, 공개 페이지.
- 온보딩 완료 여부 조회는 세션당 1회, 서버 판정. (성능/조회 방식은 구현 플랜에서 확정)

## 5. UI 변경

- `web/app/login/LoginForm.tsx`, `web/app/signup/SignupForm.tsx`:
  구분선("또는")과 "Google로 계속하기" 버튼 추가. 버튼은 `signInWithGoogle` 서버액션
  호출(form action). 기존 브랜딩/레이아웃 톤 유지.
- 신규: `web/app/onboarding/page.tsx` + `OnboardingForm.tsx`(기존 폼 컴포넌트 패턴 준수).

## 6. 에러 처리

- OAuth 시작 실패(`signInWithOAuth` error) → `/login?error=...`
- 콜백 code 누락/교환 실패 → `/login?error=...`
- 온보딩 동의 누락 → `/onboarding?error=...`
- 프로필 조회 실패 시 안전측: 온보딩 미완료로 간주하지 않고 접근 차단하지 않되,
  로그는 남긴다. (정확 동작은 구현 플랜에서 확정)

## 7. 대표님 직접 설정 체크리스트 (코드 밖 작업)

1. **Google Cloud Console**
   - 프로젝트 생성/선택 → OAuth 동의화면 구성(앱 이름 BridgeX, 지원 이메일, 도메인 `bridgexkorea.com`)
   - 사용자 인증 정보 → OAuth 클라이언트 ID(웹 애플리케이션) 생성
   - **승인된 리디렉션 URI**에 Supabase 콜백 URL 등록:
     `https://<project-ref>.supabase.co/auth/v1/callback`
     (project-ref: `lomjryokqskruzdhieol`)
   - Client ID / Client Secret 확보
2. **Supabase 대시보드**
   - Authentication → Providers → **Google** 활성화, 위 Client ID/Secret 입력
   - Authentication → URL Configuration → **Redirect URLs**에
     `https://bridgexkorea.com/auth/callback` 및 `http://localhost:3000/auth/callback` 추가
   - Site URL 확인: `https://bridgexkorea.com`

## 8. 확인 포인트 / 열린 이슈

- **계정 통합**: 같은 이메일로 이미 이메일/비번 가입한 사용자가 구글 로그인 시 동일
  계정으로 연결되도록 한다(권장안). Supabase의 자동 연결 동작 및 "확인된 이메일만
  연결" 보안설정을 배포 전 확인 필요. (구글 답변 미수신으로 권장안 가정 — 대표님 최종 확인)
- 미들웨어 온보딩 조회 방식(매 요청 DB 조회 vs 세션 메타 캐시)은 구현 플랜에서 성능
  고려해 확정.
- 백필 조건(어떤 기존 프로필을 온보딩 완료로 볼지) 구현 플랜에서 확정.

## 9. 테스트 관점

- 신규 구글 사용자: 콜백 → `/onboarding` → 동의/입력 → `/mypage`, 재로그인 시 바로 `/mypage`.
- 온보딩 미완료 상태로 보호 라우트 직접 접근 → `/onboarding`으로 튕김.
- 동의 미체크 제출 차단(서버 검증).
- 기존 이메일 회원: 백필로 온보딩 화면에 걸리지 않음.
- 콜백 code 누락/실패 → 로그인 화면 에러.
- 스모크 스크립트(`web/scripts/smoke-auth.mjs`) 확장 여부는 구현 플랜에서 판단.
