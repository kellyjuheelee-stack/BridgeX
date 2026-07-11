// 서비스롤로 export_diagnosis_requests 삽입/조회/삭제 왕복을 검증한다.
// 사용: web/.env.local 로드 후 `npm run smoke:diagnose`
// 필요한 env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// .env.local 을 간단 파싱 (dotenv 의존성 없이) — smoke-auth.mjs 와 동일 패턴
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("env NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

let ok = true;
const check = (name, cond) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) ok = false;
};

// toRow() 출력과 같은 모양의 대표 행 (서비스롤 삽입 페이로드)
const row = {
  contact_name: "스모크",
  company_name: "스모크컴퍼니",
  email: "smoke@example.com",
  phone: "010-0000-0000",
  product_name: "스모크크림",
  product_category: "스킨케어",
  target_countries: ["독일"],
  checklist_answers: { euRp: true, companyName: "스모크컴퍼니" },
  eu_compliance_readiness: ["EU 책임자(Responsible Person) 지정"],
  is_selling_in_korea: "판매 중",
  export_experience: "없음",
  has_existing_buyer: "없음",
  diagnosis_status: "submitted",
  diagnosis_result: { isBasic: true, overallScore: 42, readinessLevel: "준비 필요" },
};

// 1) 서비스롤 삽입
const { data, error } = await db.from("export_diagnosis_requests").insert(row).select("id").single();
check("서비스롤 INSERT 성공", !error && !!data);
if (error || !data) {
  console.error("INSERT 실패:", error?.message);
  process.exit(1);
}
console.log("INSERT ok:", data.id);

// 2) 읽어와 diagnosis_result / checklist_answers 지속 확인
const { data: got, error: getErr } = await db
  .from("export_diagnosis_requests")
  .select("id, diagnosis_result, checklist_answers")
  .eq("id", data.id)
  .single();
check("SELECT 성공", !getErr && !!got);
check("diagnosis_result.overallScore 지속", got?.diagnosis_result?.overallScore === 42);
check("checklist_answers.euRp 지속", got?.checklist_answers?.euRp === true);

// 3) RLS: 익명 클라이언트는 이 행을 못 읽음 (anon key 있을 때만 검사)
if (anon) {
  const anonClient = createClient(url, anon);
  const { data: leaked, error: leakErr } = await anonClient
    .from("export_diagnosis_requests")
    .select("id")
    .eq("id", data.id);
  // anon 은 테이블 GRANT 가 없어 permission denied, 또는 RLS 로 0건 — 둘 다 "못 읽음"으로 통과
  check("익명은 진단행 못 읽음 (권한거부 또는 0건)", !!leakErr || (Array.isArray(leaked) && leaked.length === 0));
} else {
  console.log("· anon key 없음 — RLS 검사 건너뜀");
}

// 4) 정리: 삽입 행 삭제
const { error: delErr } = await db.from("export_diagnosis_requests").delete().eq("id", data.id);
check("cleanup DELETE 성공", !delErr);

console.log(ok ? "\ncleanup ok — smoke:diagnose PASS" : "\nsmoke:diagnose FAIL");
process.exit(ok ? 0 : 1);
