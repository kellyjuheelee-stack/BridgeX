// web/app/(public)/diagnose/result/[id]/page.tsx
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { DiagnosisResult } from "@/lib/services/diagnosis/types";
import ResultActions from "./ResultActions";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createServiceClient();
  const { data: row } = await admin
    .from("export_diagnosis_requests")
    .select("id, email, contact_name, company_name, phone, member_id, diagnosis_result")
    .eq("id", id)
    .single();

  if (!row || !row.diagnosis_result) {
    return <main style={{ padding: 24 }}>진단 결과를 찾을 수 없습니다.</main>;
  }
  const r = row.diagnosis_result as DiagnosisResult;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLinkedMember = !!row.member_id;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>
        수출 준비도 {r.overallScore}점 · {r.readinessLevel}
      </h1>
      <p>{r.summary}</p>

      <h2>영역별 점수</h2>
      <ul>
        {Object.values(r.sections).map((s) => (
          <li key={s.label}>
            <strong>
              {s.label}: {s.score}점
            </strong>
            {s.gaps.length > 0 && <span> — 부족: {s.gaps.join(", ")}</span>}
          </li>
        ))}
      </ul>

      <h2>가장 먼저 해결할 과제</h2>
      <ol>
        {r.priorities.map((p) => (
          <li key={p.label}>
            <strong>{p.label}</strong> — {p.note}
          </li>
        ))}
      </ol>

      <h2>EU 필수요건 현황</h2>
      <p>
        보유 {r.euStatus.haveCount}/{r.euStatus.total}
        {r.euStatus.missing.length > 0 && <> · 미비: {r.euStatus.missing.join(", ")}</>}
      </p>

      {/* 전환 훅 + 비회원 가입 */}
      <ResultActions
        diagnosisId={row.id as string}
        pitch={r.consultingNeed.pitch}
        showSignup={!user && !isLinkedMember}
        prefill={{
          email: row.email as string,
          contactName: row.contact_name as string,
          companyName: row.company_name as string,
          phone: row.phone as string,
        }}
      />
    </main>
  );
}
