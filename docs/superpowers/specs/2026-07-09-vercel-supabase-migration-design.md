# BridgeX 아키텍처 마이그레이션 설계 — Vercel + Supabase

- 날짜: 2026-07-09
- 상태: 승인됨 (P1 구현 착수)
- 범위: 전체 마이그레이션 로드맵 + P1(기반) 상세

## 배경 / 목적

현재 BridgeX는 **정적 HTML 프론트 + Express/Prisma/SQLite 백엔드**를 로컬(백엔드 4000, 정적서버 4599)에서 실행한다. 이를 **Vercel 호스팅 + Supabase(Postgres·Auth·Storage)** 기반의 **Next.js 앱**으로 전면 재작성한다.

옮기려는 이유(사용자 확인, 4가지 전부 해당):
1. 배포/운영 간편화 — 로컬 실행 대신 실제 인터넷 호스팅
2. 관리형 DB 안정성 — SQLite 파일 → Supabase Postgres(클라우드 저장·백업)
3. 인증 위임 — 자체 JWT/bcrypt → Supabase Auth(로그인·비번재설정·보안)
4. 파일 스토리지 — multer 로컬 → Supabase Storage

## 확정된 결정 (브레인스토밍 결과)

| 항목 | 결정 |
|---|---|
| 호스팅 | Vercel |
| 프론트+백엔드 | Next.js (App Router) — **전면 재작성** |
| 언어 | **TypeScript** |
| DB | Supabase Postgres |
| 인증 | Supabase Auth + `profiles.is_admin` 역할 |
| 파일 | Supabase Storage |
| 메일 | 기존 유지(콘솔 모드), 나중에 SMTP 연결 (pending-smtp-email) |
| 데이터 접근 | **서버 중심** — 모든 DB 작업은 Next.js 서버(Server Actions / Route Handlers)가 Supabase 서비스 키로 처리, RLS는 2차 방어선 |
| 기존 데이터 | **이전 안 함** — 테스트 데이터뿐이므로 새로 시작 |

## 목표 스택 대조표

| 레이어 | 현재 | 목표 |
|---|---|---|
| 호스팅 | 로컬 4000/4599 | Vercel |
| 프론트+백엔드 | 정적 HTML + Express | Next.js (App Router, TS) |
| DB | SQLite + Prisma | Supabase Postgres |
| 인증 | 자체 JWT(회원/관리자 2역할) | Supabase Auth + is_admin |
| 파일 | multer 로컬 | Supabase Storage |
| 메일 | nodemailer(콘솔) | 유지 (나중에 SMTP) |
| 데이터 접근 | Prisma 직접 | 서버 중심 + RLS 2차 |

## 앱 구조 (Next.js App Router)

```
app/
  (public)/            ← 랜딩, 진단폼, 로그인/가입, 약관/방침
  (member)/
    mypage/
    tools/email/
    tools/catalog/
    tools/reply/
  (admin)/
    admin/             ← is_admin 게이트
  api/                 ← 필요 시 Route Handlers (파일·웹훅 등)
lib/
  supabase/
    server.ts          ← 서버 컴포넌트/액션용 클라이언트 (서비스 키)
    client.ts          ← 브라우저용 클라이언트 (anon 키)
  services/            ← 규칙 엔진 이식 (diagnosis, roadmap, catalogAudit, replyAssistant, email)
  constants/           ← 기존 rules 파일 이식 (catalogAuditRules, emailTemplates, replyAssistant, enums)
```

원칙:
- **규칙 엔진 5개는 순수 함수이므로 로직 변경 없이 TS로 그대로 이식**한다. 고도화·기능 추가 없음. 이식 정확성은 회귀 테스트로 보장.
- 화면은 서버 컴포넌트 우선, 폼 제출은 Server Action.
- 파일이 커지면 책임 분리 신호로 보고 쪼갠다.

## 데이터 모델 (Postgres, RLS 활성)

기존 2개 모델을 네이티브 Postgres 타입으로 승격한다. SQLite 제약으로 TEXT에 JSON 문자열로 저장하던 필드는 진짜 타입으로 바꿔 `serialize.js` 우회를 제거한다.

- TEXT-JSON 문자열 → `jsonb`
- 콤마/JSON 배열 → `text[]`

### `profiles` (Supabase auth.users와 1:1)
- `id uuid PK` = `auth.users.id`
- `name text`, `company_name text`, `phone text`
- `is_admin boolean default false`
- `roadmap_progress jsonb` — `{ "<stepId>": { done, doneAt } }`
- `created_at`, `last_login_at`
- 비밀번호는 저장하지 않음(Supabase Auth가 관리)

### `export_diagnosis_requests`
- 기존 스키마의 모든 필드 이식 (Step1 기본정보 / Step2 제품 / Step3 수출목표 / Step4 진단상태 / 상담 / 컨설팅 트랙)
- 배열 필드(`certifications`, `targetCountries`, `preferredChannels`, `painPoints`, `euComplianceReadiness`, `packagingReadiness`) → `text[]`
- 객체 필드(`diagnosisResult`, `productFiles`, `consultingChecklist`, `meetings`) → `jsonb`
- `member_id uuid` → `profiles.id` FK, **null 허용**(비회원 제출)
- 인덱스: `diagnosis_status`, `product_category`, `submitted_at`

### RLS 정책
- `profiles`: 회원은 `auth.uid() = id` 인 자기 행만 select/update. insert는 가입 트리거로.
- `export_diagnosis_requests`: 회원은 `member_id = auth.uid()` 인 자기 진단만 select.
- **쓰기·관리자 전체 조회·규칙 계산은 서버(서비스 키)가 RLS를 우회해 처리** (서버 중심 원칙).
- 서비스 키는 서버 전용 환경변수, 클라이언트에 노출 금지.

## 인증 흐름

- 회원가입/로그인/비번재설정 → Supabase Auth. 자체 bcrypt·JWT·auth.controller 제거.
- **가입 시 `profiles` 자동 생성**: Postgres 트리거(`on auth.users insert → insert profiles`) 또는 서버 액션에서 생성.
- **비회원 진단 → 결과화면 가입 UX 유지**: 진단을 `member_id null`로 저장 → 결과화면에서 `supabase.auth.signUp` → 성공 시 서버가 해당 진단행의 `member_id`를 새 uid로 업데이트.
- **관리자**: 미리 생성한 Supabase 유저 + `profiles.is_admin = true`. `(admin)` 라우트는 서버에서 세션 확인 후 `is_admin` 검증, 실패 시 리다이렉트.

## 마이그레이션 단계 (각 단계 독립 배포)

각 단계는 별도 스펙→플랜→구현 사이클을 가진다. 본 문서는 전체 로드맵 + P1 상세.

### P1 — 기반 (본 문서 대상)
- Next.js 스캐폴드(App Router, TS)
- Supabase 프로젝트 생성 + 스키마(profiles, export_diagnosis_requests) + RLS 정책
- Supabase Auth 연결(서버/클라 클라이언트, 세션 미들웨어)
- 관리자 유저 시드(is_admin)
- Vercel 배포 파이프라인(환경변수 포함)
- **완료 기준: 빈 껍데기 앱이 Vercel에 실제 배포되고, 로그인/가입이 Supabase Auth로 동작하며, 관리자 게이트가 작동**

### P2 — 공개 + 회원
- 랜딩, 진단폼(4단계), 진단 자동 계산, 마이페이지(KPI·진단현황·로드맵)
- 규칙 엔진 이식: `aiDiagnosis`, `diagnosis`, `roadmap` + 회귀 테스트 이식
- 2개 유입(회원가입→진단 / 비회원→결과화면 가입) 재현

### P3 — 회원 도구
- email / catalog / reply 3종 도구
- 규칙 엔진 이식: `emailTemplates`, `catalogAuditRules`, `replyAssistant` + 회귀 테스트
- Supabase Storage 파일 업로드(제품 이미지 등)

### P4 — 관리자
- 백오피스: 리드 목록(점수·단계 컬럼·핫리드 강조), 리드 브리핑, 컨설팅 트랙(7단계·체크리스트·메모), 미팅 관리

### P5 — 마감
- 커스텀 도메인, 프로덕션 환경변수, 법무 placeholder 실제값(privacy/terms), 최종 검증
- 기존 Express 백엔드 + 정적 HTML 제거

## 테스트 전략

- **규칙 엔진 회귀 테스트를 그대로 이식**해 이식 정확성 보장 — 로직이 바뀌지 않았음을 증명(현 `test:diagnosis`, `test:roadmap`, `test:catalog`, `test:reply`).
- 인증/RLS는 Supabase 로컬 또는 스테이징 프로젝트에서 스모크.
- 각 단계 완료 시 verification-before-completion으로 실제 배포/동작 확인 후 완료 선언.

## 비목표 (YAGNI)

- 규칙 엔진 로직 고도화 — 이번 마이그레이션에서는 하지 않음(동작 동일성 유지가 목표)
- Claude API 연동 — 별도 후속 작업
- 2b 카탈로그 생성기(유료) — 별도 후속
- SQLite → Postgres 데이터 이전 스크립트 — 새로 시작이므로 불필요
- 실제 SMTP 발송 — 콘솔 모드 유지, 나중에 네이버 SMTP 연결

## 리스크 / 오픈 이슈

- Supabase 프로젝트 생성·키 발급은 사용자 계정 작업이 필요(대시보드). 구현 중 자격증명 주입 방법 확정 필요.
- 비회원 진단행을 가입 시 uid에 연결하는 구간은 서버 액션에서 원자적으로 처리(경합/중복 가입 방어).
- Vercel 환경변수(서비스 키)와 클라이언트 anon 키 분리 엄수.
