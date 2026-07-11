-- web/supabase/migrations/0004_harden_advisors.sql
-- Supabase database linter(advisor) 권고 반영: 함수 search_path 고정, 트리거 함수의
-- 불필요한 RPC 노출(EXECUTE) 회수, RLS 정책의 auth.uid() 재평가 최적화.

-- 1) search_path 고정 (set_updated_at 은 0001 에서 누락됨)
alter function public.set_updated_at() set search_path = '';

-- 2) 트리거 전용 함수를 REST RPC(/rest/v1/rpc/...)로 호출하지 못하도록 EXECUTE 회수.
--    트리거로만 쓰이므로 anon/authenticated/public 에 실행 권한이 필요 없다.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.set_updated_at()  from anon, authenticated, public;

-- 3) RLS 정책: auth.uid() 를 (select auth.uid()) 로 감싸 행마다 재평가되지 않게 한다.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using ((select auth.uid()) = id);

drop policy if exists edr_select_own on public.export_diagnosis_requests;
create policy edr_select_own on public.export_diagnosis_requests
  for select using ((select auth.uid()) = member_id);
