-- web/supabase/migrations/0003_role_grants.sql
-- MCP apply_migration 은 postgres 가 아닌 마이그레이션 롤로 테이블을 생성하므로
-- Supabase 기본 default privileges 가 자동 적용되지 않아 service_role 에도
-- SELECT/INSERT/UPDATE/DELETE 권한이 붙지 않았다(테이블 접근 자체가 permission denied).
--
-- 이 앱의 모든 테이블 접근은 서버 전용 service_role(createServiceClient)로만 이뤄지고,
-- anon/authenticated 클라이언트는 인증(auth) 용도로만 쓰인다. 따라서 여기서는 신뢰 롤인
-- service_role 에만 테이블 권한을 복구한다. (anon/authenticated 직접 쿼리를 쓰게 되면
-- 그때 RLS 와 함께 별도 GRANT 를 추가한다.)

grant usage on schema public to service_role;

grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines  in schema public to service_role;

alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines  to service_role;
