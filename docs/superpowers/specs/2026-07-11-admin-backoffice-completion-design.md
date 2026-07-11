# P1 설계 — 관리자 백오피스 완성 (리드 운영·전환 엔진)

- 작성일: 2026-07-11
- 역할: 기획자 세션 (스펙만, 코드 금지 — [[role-planner-not-developer]])
- 상위 문서: `2026-07-11-next-features-roadmap.md` 의 **P1**
- 대상: `web/` (Next.js/Supabase). 구 스택 무관.
- 한 줄: 진단으로 들어온 리드를 컨설턴트(대표님)가 **빠르게 우선순위화 → 맥락 파악 → 전환**하도록 관리자 화면을 완성한다. 마이그레이션 갭 ①(stepContext 미저장) ③(목록 필터/정렬/페이지네이션) + 후보(관리자에서 회원 로드맵 보기)를 하나로 닫는다.

---

## 1. 문제 (Why)

현재 `/admin`은 전 리드를 `submitted_at desc`로 **그냥 나열**한다. 컨설턴트가 실제로 하는 일 — "지금 연락해야 할 핫리드가 누구인가, 이 사람은 뭘 못 해서 상담을 신청했나, 어디까지 스스로 진행했나" — 를 화면이 받쳐주지 못한다.

- **갭③**: 리드가 쌓이면 최신순 한 줄 나열로는 우선순위 판단 불가. 필터·정렬·페이지네이션 없음.
- **갭①**: 회원이 로드맵의 특정 🔴전문가 단계 "벽"에서 상담을 신청해도, **어느 단계에서 신청했는지**가 새 스키마에 저장되지 않는다(구 스택은 `admin_memo`에 `[로드맵] '...' 단계에서 상담 신청`으로 기록). → 컨설턴트가 상담 준비 맥락을 잃는다.
- **후보(회원 로드맵 가시성)**: 리드 상세에서 그 회원이 로드맵을 어디까지 진행했는지(완료율·막힌 단계) 안 보인다. 대화 준비의 핵심 정보인데 부재.

## 2. 목표 / 비목표

**목표**
1. 상담 신청 시 **stepContext를 구조화 저장**하고 리드 상세·목록에서 노출.
2. 관리자 목록에 **필터 · 정렬 · 페이지네이션 · 핫리드 상단 고정** 추가.
3. 리드 상세에 해당 회원의 **로드맵 진행 요약**(N/16, 완료율, 막힌 🔴단계) 읽기전용 표시.

**비목표**
- 리드 상태를 관리자가 자유편집하는 대규모 CRM화 (기존 컨설팅 트랙 유지, 확장만).
- 바이어 매칭(P3), 알림 발송(P4), LLM 연동(P5) — 별도 에픽.
- 새 인증/권한 모델 — 기존 `requireAdmin` + 서비스롤 그대로.

## 3. 불변 원칙 계승 (충돌 방지)
- 모든 관리자 데이터 접근은 **서버(서비스 롤)** + `requireAdmin` 게이트. RLS는 회원 self-select만.
- 데이터 변경은 **add column only** — 기존 컬럼 삭제·타입변경·기존 엔진 시그니처 변경 없음.
- `buildRoadmap`은 순수함수 그대로 재사용(관리자 화면도 같은 엔진으로 회원 로드맵을 재구성 → 회원/관리자 뷰 일관성).

---

## 4. 데이터 모델 변경 (최소)

마이그레이션 **`0003_admin_backoffice.sql`** (add-only):

```sql
-- 상담 신청 맥락: 어느 로드맵 단계 "벽"에서 상담을 신청했는지
alter table public.export_diagnosis_requests
  add column if not exists consultation_step_context text;

-- 목록 필터/정렬 성능 (선택적, 데이터 커지면 유효)
create index if not exists edr_consultation_requested_idx
  on public.export_diagnosis_requests (consultation_requested);
```

- 회원 로드맵 진행은 **이미 있는** `profiles.roadmap_progress jsonb`를 읽어 재구성 → 스키마 추가 불필요.
- `consulting_stage` 등 정렬 대상 컬럼은 이미 존재.

## 5. 기능 상세

### 5.1 상담 신청 stepContext 저장·표시 (갭①)

**저장 지점**: 회원이 로드맵 🔴단계 또는 마이페이지 상담 CTA로 상담을 신청하는 서버액션(현 상담 신청 액션). 신청 시 아래를 함께 기록:
- `consultation_requested = true`, `consultation_requested_at = now()`
- `consultation_step_context = <단계 라벨>` — 예: `"영문 카탈로그 제작 (전문가)"`. 로드맵 단계에서 온 경우 그 단계 title, 마이페이지 일반 상담이면 `"마이페이지 일반 상담"`.
- 상태를 `consulting_needed`로 승격(기존 훅 동작 유지).

**설계 결정**: 구 스택은 이 맥락을 `admin_memo`에 텍스트로 흘렸다. 새 설계는 **전용 컬럼**으로 구조화 → 목록 필터·표시에 재사용 가능(자유 메모는 `admin_memo`로 분리 유지). `admin_memo`에 중복 기록하지 않는다(단일 출처).

**표시**:
- 리드 상세 상단 "전환 포인트" 근처에 **"상담 신청 맥락"** 배지 — `consultation_step_context` + `consultation_requested_at`.
- 목록 핫리드 행 hover/보조열에 축약 표시(선택).

### 5.2 관리자 목록 강화 (갭③)

현재 `/admin/page.tsx`는 서버컴포넌트에서 전건 fetch → 클라 필터 없음. 다음을 **URL searchParams 기반**(서버컴포넌트 친화, 새로고침·공유 가능)으로 추가:

- **필터**
  - 상태(`diagnosis_status`): submitted / reviewing / ai_generated / consulting_needed / completed / archived (기존 `STATUS_LABELS` 재사용).
  - 컨설팅 단계(`consulting_stage`): `CONSULTING_STAGES` 7종 + 미배정.
  - 제품 카테고리(`product_category`, 인덱스 존재).
  - 검색어: 회사명/담당자/이메일 부분일치(서버 `ilike`).
- **정렬**: 제출일(기본 desc) / 점수(`diagnosis_result->>overallScore` 내림) / 회사명. 
  - 주의: 점수는 jsonb 내부값 → 정렬 시 `(diagnosis_result->>'overallScore')::numeric nulls last` 사용, null(미채점) 하단.
- **핫리드 상단 고정**: `consultation_requested = true OR diagnosis_status='consulting_needed'` 리드를 정렬과 무관하게 **최상단 그룹**으로. (구현: 2쿼리 or 정렬키에 hot 우선순위 추가. 스펙은 "핫리드 먼저"만 요구, 방식은 플랜에서.)
- **페이지네이션**: 페이지당 25건, `range()` 기반, 하단 이전/다음 + 총건수. searchParams `page`.
- **상단 요약 스트립**(선택, 값 큼): 총 리드 / 핫리드 수 / 단계별 카운트 → 컨설턴트 대시보드 감각. 규칙기반 count 쿼리.

**UI 원칙**: 기존 테이블 스타일(`th`/`td`/`chip`/`StatusBadge`/`scoreColor`) 그대로. 필터바만 테이블 위에 추가. 과한 대시보드 금지(사용자 기존 선호: "과한 대시보드 아님").

### 5.3 리드 상세 — 회원 로드맵 진행 요약 (후보)

리드가 **회원 연결된 경우**(`member_id` not null)만:
- 서버에서 `profiles.roadmap_progress` + 그 회원 최신 진단행을 읽어 **`buildRoadmap()` 재실행** → 회원 마이페이지와 동일한 로드맵 상태 재구성.
- 리드 상세에 읽기전용 카드:
  - 진행률: 완료 N / 전체 16 (%), 
  - **막힌 🔴전문가 단계** 목록(회원이 아직 못 넘은 벽) — 상담에서 먼저 다룰 지점,
  - 최근 완료 단계.
- 비회원 리드(진단만 하고 가입 안 함)는 이 카드 숨김 + "비회원 리드" 표시.

**재사용**: `buildRoadmap`, `toRoadmapDiagnosis`(fromRow)를 관리자 코드에서 그대로 import → 회원/관리자 로드맵 표현 100% 일치. 새 엔진 없음.

---

## 6. 영향 범위 (파일 수준, 개발자 세션 참고용)

- `web/supabase/migrations/0003_admin_backoffice.sql` (신규, add-only)
- 상담 신청 서버액션 (현 위치 확인 필요 — mypage/로드맵 상담 CTA 액션): `consultation_step_context` 기록 추가.
- `web/app/(admin)/admin/page.tsx`: searchParams 필터/정렬/페이지네이션/핫리드 우선.
- `web/app/(admin)/admin/leads/[id]/page.tsx`: 상담 맥락 배지 + 회원 로드맵 요약 카드.
- (신규 UI 컴포넌트) 필터바 — 서버컴포넌트 form(GET) 또는 소형 클라이언트 컴포넌트.
- 기존 순수엔진/`consulting` 상수/`buildRoadmap`: **수정 없음, 재사용만.**

## 7. 테스트 전략 (순수 로직 우선 — 기존 vitest 패턴 계승)
- **stepContext 매핑**: 로드맵 단계 → 저장 문자열 파생 순수함수로 뽑아 단위테스트(단계별 라벨 정확성).
- **목록 쿼리 파라미터 → 쿼리조건** 변환을 순수함수로 분리해 테스트(필터/정렬/페이지 계산, 잘못된 값 방어).
- **회원 로드맵 요약 파생**(막힌 단계 추출·완료율)을 순수함수로 → 단위테스트.
- E2E 스모크: 라이브 Supabase 필요분은 기존 `smoke:*` 패턴에 관리자 목록 필터 1케이스 추가(옵션).
- 회귀: 기존 47 테스트 green 유지(엔진 미변경이므로 영향 없음이 정상).

## 8. 열린 결정 (사용자 확인 없이 기본값으로 진행, 원하면 수정)
- D1. 페이지당 25건 (기본값). 리드량 적으면 체감 무의미 → 그대로 두되 임계 낮음.
- D2. 핫리드 상단 고정을 "정렬 무시 최상단 그룹"으로(기본) vs "정렬 내에서 hot 컬럼 우선". → 기본: 최상단 그룹(컨설턴트가 놓치지 않게).
- D3. 상단 요약 스트립 포함(기본 포함, 규칙기반 count) — 과하다 판단되면 제거 가능.
- D4. stepContext는 전용 컬럼(기본) — `admin_memo` 병행 기록 안 함(단일 출처).

## 9. 다음 단계
- 사용자 확인 후 **구현 플랜** `docs/superpowers/plans/2026-07-11-admin-backoffice-completion.md`를 writing-plans 흐름으로 작성(태스크 분해: 마이그레이션 → stepContext 저장 → 순수함수+TDD → 목록 강화 → 상세 로드맵 카드 → 스모크). 개발자 세션이 실행.

관련: [[bridgex-build-progress]] · [[role-planner-not-developer]]
