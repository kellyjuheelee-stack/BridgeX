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
