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
