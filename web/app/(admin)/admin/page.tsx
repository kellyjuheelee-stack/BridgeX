// web/app/(admin)/admin/page.tsx
// 관리자 백오피스 — 진단 요청 리드 목록. admin.html 의 테이블을 충실히 포팅.
// 모든 데이터 접근은 서버(서비스 롤)로 RLS 우회, requireAdmin 게이트.
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { signOut } from "@/app/auth/actions";
import { CONSULTING_STAGES, STATUS_LABELS } from "@/lib/constants/consulting";
import type { DiagnosisResult } from "@/lib/services/diagnosis/types";

export const dynamic = "force-dynamic";

interface LeadRow {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  product_category: string | null;
  target_countries: string[] | null;
  pain_points: string[] | null;
  diagnosis_status: string;
  diagnosis_result: DiagnosisResult | null;
  consulting_stage: string | null;
  consultation_requested: boolean | null;
  consultation_requested_at: string | null;
  submitted_at: string | null;
}

// admin.html scoreCell 과 동일 임계값/색상
function scoreColor(s: number): string {
  return s >= 75 ? "#2e9e6b" : s >= 55 ? "#0071e3" : "#d68e2e";
}

function fmtDate(s?: string | null): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  submitted: { bg: "rgba(0,102,204,0.12)", color: "#0066cc" },
  reviewing: { bg: "rgba(214,158,46,0.16)", color: "#a9741a" },
  ai_generated: { bg: "rgba(120,80,220,0.14)", color: "#6b46c1" },
  consulting_needed: { bg: "rgba(224,120,60,0.16)", color: "#c05a1e" },
  completed: { bg: "rgba(46,158,107,0.16)", color: "#1e7a50" },
  archived: { bg: "rgba(0,0,0,0.07)", color: "#6e6e73" },
};

function StatusBadge({ status }: { status: string }) {
  const st = STATUS_STYLE[status] ?? { bg: "rgba(0,0,0,0.07)", color: "#6e6e73" };
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        background: st.bg,
        color: st.color,
      }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 12px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.3,
  textTransform: "uppercase",
  color: "#6e6e73",
  background: "#fafafc",
  whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
};
const td: React.CSSProperties = {
  padding: "11px 12px",
  fontSize: 13,
  whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  verticalAlign: "middle",
};
const chip: React.CSSProperties = {
  fontSize: 11,
  background: "#f5f5f7",
  borderRadius: 5,
  padding: "2px 7px",
  color: "#1d1d1f",
};

export default async function AdminHome() {
  await requireAdmin(); // 관리자 아니면 /login 으로 redirect

  const svc = createServiceClient();
  const { data } = await svc
    .from("export_diagnosis_requests")
    .select(
      "id, company_name, contact_name, email, phone, product_category, target_countries, pain_points, diagnosis_status, diagnosis_result, consulting_stage, consultation_requested, consultation_requested_at, submitted_at"
    )
    .order("submitted_at", { ascending: false, nullsFirst: false });

  const all = (data ?? []) as LeadRow[];
  // 상담 신청한 리드를 목록 맨 위로 (그 안에서는 신청 시각 최신순)
  const rows = [...all].sort((a, b) => {
    const ca = a.consultation_requested ? 1 : 0;
    const cb = b.consultation_requested ? 1 : 0;
    if (ca !== cb) return cb - ca;
    return (b.consultation_requested_at ?? "").localeCompare(a.consultation_requested_at ?? "");
  });
  const consultCount = all.filter((r) => r.consultation_requested).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f7",
        color: "#1d1d1f",
        fontFamily: "'Inter','Noto Sans KR',system-ui,sans-serif",
        wordBreak: "keep-all",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(20px,4vw,40px)",
          background: "rgba(250,248,244,0.9)",
          backdropFilter: "saturate(180%) blur(14px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
          Bridge<span style={{ color: "#0066cc" }}>X</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#6e6e73",
              marginLeft: 8,
              padding: "3px 8px",
              background: "#f5f5f7",
              borderRadius: 6,
            }}
          >
            ADMIN
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <a href="/" style={{ fontSize: 14, fontWeight: 600, color: "#6e6e73" }}>
            랜딩 →
          </a>
          <form action={signOut}>
            <button
              type="submit"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#6e6e73",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              로그아웃
            </button>
          </form>
        </div>
      </nav>

      <div style={{ maxWidth: 1720, margin: "0 auto", padding: "24px clamp(16px,2.5vw,28px) 60px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
            수출 가능성 진단 요청
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#6e6e73", fontWeight: 600 }}>
            {consultCount > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "rgba(224,120,60,0.14)",
                  color: "#c05a1e",
                }}
              >
                🔔 상담 신청 {consultCount}건
              </span>
            )}
            <span>총 {rows.length}건</span>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
              <thead>
                <tr>
                  <th style={th}>제출일</th>
                  <th style={th}>회사명</th>
                  <th style={th}>담당자</th>
                  <th style={th}>이메일</th>
                  <th style={th}>전화번호</th>
                  <th style={th}>제품 카테고리</th>
                  <th style={th}>목표 국가</th>
                  <th style={th}>가장 어려운 부분</th>
                  <th style={th}>점수</th>
                  <th style={th}>상태</th>
                  <th style={th}>단계</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const hot =
                    r.diagnosis_status === "consulting_needed" || !!r.consultation_requested;
                  const score =
                    r.diagnosis_result && typeof r.diagnosis_result.overallScore === "number"
                      ? r.diagnosis_result.overallScore
                      : null;
                  const stage = r.consulting_stage
                    ? CONSULTING_STAGES.find((s) => s.key === r.consulting_stage)?.title ??
                      r.consulting_stage
                    : null;
                  const countries = r.target_countries ?? [];
                  const pains = (r.pain_points ?? []).slice(0, 2);
                  const morePain = (r.pain_points ?? []).length > 2;
                  return (
                    <tr
                      key={r.id}
                      style={hot ? { background: "rgba(224,120,60,0.06)" } : undefined}
                    >
                      <td style={{ ...td, color: "#6e6e73" }}>{fmtDate(r.submitted_at)}</td>
                      <td style={{ ...td, fontWeight: 700 }}>
                        <Link href={`/admin/leads/${r.id}`} style={{ color: "#0066cc" }}>
                          {r.company_name || "-"}
                        </Link>
                      </td>
                      <td style={td}>{r.contact_name || "-"}</td>
                      <td style={{ ...td, color: "#6e6e73" }}>{r.email || "-"}</td>
                      <td style={{ ...td, color: "#6e6e73" }}>{r.phone || "-"}</td>
                      <td style={td}>
                        {r.product_category ? (
                          <span style={chip}>{r.product_category}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 220, whiteSpace: "normal" }}>
                          {countries.map((c) => (
                            <span key={c} style={chip}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 220, whiteSpace: "normal" }}>
                          {pains.map((p) => (
                            <span key={p} style={chip}>
                              {p}
                            </span>
                          ))}
                          {morePain && <span style={chip}>…</span>}
                        </div>
                      </td>
                      <td style={td}>
                        {score === null ? (
                          <span style={{ color: "#6e6e73" }}>—</span>
                        ) : (
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 12,
                              fontWeight: 800,
                              border: `1.5px solid ${scoreColor(score)}`,
                              color: scoreColor(score),
                              borderRadius: 8,
                              padding: "2px 8px",
                            }}
                          >
                            {score}
                          </span>
                        )}
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5 }}>
                          <StatusBadge status={r.diagnosis_status} />
                          {r.consultation_requested && (
                            <span
                              title={
                                r.consultation_requested_at
                                  ? `상담 신청: ${fmtDate(r.consultation_requested_at)}`
                                  : "상담 신청"
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "4px 9px",
                                borderRadius: 999,
                                whiteSpace: "nowrap",
                                background: "#c05a1e",
                                color: "#fff",
                              }}
                            >
                              🔔 상담 신청
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...td, color: "#6e6e73" }}>{stage ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div style={{ padding: 60, textAlign: "center", color: "#6e6e73", fontSize: 14 }}>
              진단 요청이 없습니다.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
