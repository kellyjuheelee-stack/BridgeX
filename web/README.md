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
