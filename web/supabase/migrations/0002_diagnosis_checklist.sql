-- web/supabase/migrations/0002_diagnosis_checklist.sql
-- 체크리스트형 진단 개편: 원본 응답 저장 컬럼 + 개편으로 사라진 필드 제약 완화.
-- 스펙: docs/superpowers/specs/2026-07-09-diagnosis-checklist-redesign-design.md

alter table public.export_diagnosis_requests
  add column if not exists checklist_answers jsonb not null default '{}'::jsonb;

-- 체크리스트가 더 이상 직접 수집하지 않는 필드의 NOT NULL 완화
alter table public.export_diagnosis_requests
  alter column has_inci drop not null;
