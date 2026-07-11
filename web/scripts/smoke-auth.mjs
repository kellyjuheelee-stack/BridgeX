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
// Supabase Auth 는 예약 TLD(.test 등)를 거부하므로 검증을 통과하는 도메인을 쓴다.
const email = `smoke+${Date.now()}@example.com`;
const password = "smoke-pass-123";
let ok = true;
const check = (name, cond) => { console.log(`${cond ? "✓" : "✗"} ${name}`); if (!cond) ok = false; };

// 1) 유저 생성 → auth 유저 + 트리거로 profiles 생성
//    anon signUp 은 Confirm email ON 시 확인 메일을 발송해 내장 SMTP rate limit(429)에 걸린다.
//    스모크는 메일 발송 없이 서비스롤 admin.createUser 로 만든다(트리거는 동일하게 발화).
const { data: created, error: suErr } = await svc.auth.admin.createUser({
  email, password, email_confirm: true,
  user_metadata: { name: "스모크", company_name: "테스트상사", phone: "01000000000" },
});
check("회원가입 성공", !suErr && !!created.user);
const uid = created.user?.id;

// 2) 트리거가 profiles 행을 만들었는지 (서비스 롤로 조회)
const { data: prof } = await svc.from("profiles").select("*").eq("id", uid).single();
check("가입 트리거가 profiles 생성", !!prof);
check("profiles.name 매핑", prof?.name === "스모크");
check("기본 is_admin=false", prof?.is_admin === false);

// 3) 로그인 (이메일 확인 완료 상태이므로 Confirm email 설정과 무관하게 성공해야 함)
const { data: signIn, error: siErr } = await anonClient.auth.signInWithPassword({ email, password });
check("로그인 성공", !siErr && !!signIn.session);

// 4) RLS: 익명(로그인 안 한) 클라이언트는 남의 profiles 를 못 봄
const anon2 = createClient(url, anon);
const { data: leaked, error: leakErr } = await anon2.from("profiles").select("*").eq("id", uid);
// anon 은 테이블 GRANT 가 없어 permission denied, 또는 RLS 로 0건 — 둘 다 "못 읽음"으로 통과
check("비로그인은 profiles 못 읽음 (권한거부 또는 0건)", !!leakErr || (Array.isArray(leaked) && leaked.length === 0));

// 5) is_admin 승격 → resolveAccess 관리자 판정 시나리오
await svc.from("profiles").update({ is_admin: true }).eq("id", uid);
const { data: promoted } = await svc.from("profiles").select("is_admin").eq("id", uid).single();
check("is_admin 승격 반영", promoted?.is_admin === true);

// 정리: 스모크 유저 삭제
if (uid) await svc.auth.admin.deleteUser(uid);

console.log(ok ? "\nSMOKE PASS" : "\nSMOKE FAIL");
process.exit(ok ? 0 : 1);
