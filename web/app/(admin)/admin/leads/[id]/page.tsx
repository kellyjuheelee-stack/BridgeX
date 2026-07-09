// web/app/(admin)/admin/leads/[id]/page.tsx
// 리드 상세 / 브리핑 — admin.html openDetail 포팅. 전환 중심 브리핑 + 컨설팅 트랙 + 미팅.
// 서버 컴포넌트: requireAdmin 후 서비스 롤로 단건 조회. 인터랙션은 자식 클라이언트 컴포넌트가 담당.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { CONSULTING_STAGES } from "@/lib/constants/consulting";
import type { DiagnosisResult } from "@/lib/services/diagnosis/types";
import AdminMeta from "./AdminMeta";
import ConsultingTrack from "./ConsultingTrack";
import Meetings from "./Meetings";
import type { Meeting } from "./actions";

export const dynamic = "force-dynamic";

interface ProductFile {
  fileName?: string;
  fileUrl?: string;
}

interface LeadDetail {
  id: string;
  contact_name: string | null;
  company_name: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  homepage_url: string | null;
  smart_store_url: string | null;
  instagram_url: string | null;
  annual_revenue_range: string | null;
  product_name: string | null;
  product_category: string | null;
  product_files: ProductFile[] | null;
  has_inci: string | null;
  volume_and_price_range: string | null;
  is_selling_in_korea: string | null;
  monthly_sales_or_best_seller: string | null;
  certifications: string[] | null;
  eu_compliance_readiness: string[] | null;
  packaging_readiness: string[] | null;
  target_countries: string[] | null;
  preferred_channels: string[] | null;
  export_experience: string | null;
  trade_fair_experience: string | null;
  has_existing_buyer: string | null;
  pain_points: string[] | null;
  diagnosis_status: string;
  diagnosis_result: DiagnosisResult | null;
  admin_memo: string | null;
  consulting_stage: string | null;
  consulting_checklist: Record<string, boolean> | null;
  consulting_notes: string | null;
  meetings: Meeting[] | null;
  submitted_at: string | null;
}

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

function disp(v: string | string[] | null | undefined): string {
  if (Array.isArray(v)) return v.length ? v.join(", ") : "";
  return v || "";
}

function InfoRow({ label, value }: { label: string; value: string | string[] | null | undefined }) {
  const d = disp(value);
  return (
    <div style={{ display: "flex", gap: 14, padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14 }}>
      <div style={{ flex: "0 0 34%", color: "#6e6e73", fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, color: d ? "#1d1d1f" : "#b0b0b5" }}>{d || "미입력"}</div>
    </div>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: "#0066cc",
        letterSpacing: 0.4,
        textTransform: "uppercase",
        margin: "0 0 10px",
      }}
    >
      {children}
    </h3>
  );
}

const groupStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
  padding: "22px 26px",
  marginBottom: 22,
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const svc = createServiceClient();
  const { data } = await svc
    .from("export_diagnosis_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle<LeadDetail>();

  if (!data) notFound();
  const d = data;

  const r = d.diagnosis_result;
  const hasBrief = !!r && typeof r.overallScore === "number";
  const files = d.product_files ?? [];

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
        <Link href="/admin" style={{ fontSize: 14, fontWeight: 600, color: "#6e6e73" }}>
          ← 목록
        </Link>
      </nav>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px clamp(16px,3vw,32px) 60px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, margin: "0 0 20px" }}>
          {d.company_name || "-"} · {d.product_name || "-"}
        </h1>

        {/* 리드 브리핑 (전환 중심). 신규 필드 없으면 JSON 폴백 */}
        {hasBrief && r ? (
          <div style={groupStyle}>
            <GroupTitle>🎯 리드 브리핑</GroupTitle>
            <div
              style={{
                background: "linear-gradient(180deg,rgba(0,102,204,0.05),rgba(0,102,204,0.02))",
                border: "1px solid rgba(0,102,204,0.18)",
                borderRadius: 14,
                padding: "18px 20px",
              }}
            >
              <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    letterSpacing: -1,
                    lineHeight: 1,
                    color: scoreColor(r.overallScore),
                  }}
                >
                  {r.overallScore}
                  <span style={{ fontSize: 14, color: "#6e6e73", fontWeight: 600 }}>/100</span>
                </div>
                <div style={{ flex: 1, minWidth: 220, fontSize: 13 }}>
                  <b style={{ fontSize: 15 }}>{r.readinessLevel || ""}</b>
                  {r.euStatus ? ` · EU 필수요건 ${r.euStatus.haveCount}/${r.euStatus.total}` : ""}
                  <p style={{ margin: "6px 0 0", color: "#1d1d1f", lineHeight: 1.55 }}>{r.summary || ""}</p>
                </div>
              </div>

              {r.priorities && r.priorities.length > 0 && (
                <>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#6e6e73",
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      margin: "14px 0 8px",
                    }}
                  >
                    전환 포인트 · 가장 먼저 해결할 과제
                  </div>
                  {r.priorities.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        padding: "7px 0",
                        borderBottom: i === r.priorities.length - 1 ? "none" : "1px solid rgba(0,0,0,0.05)",
                      }}
                    >
                      <span
                        style={{
                          flex: "0 0 auto",
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#0071e3",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 1,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <b style={{ fontSize: 13.5 }}>{p.label}</b>
                        <div style={{ fontSize: 12.5, color: "#6e6e73", lineHeight: 1.5, marginTop: 1 }}>{p.note}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {r.sections &&
                (() => {
                  const gapRows = Object.values(r.sections).filter((s) => s.gaps && s.gaps.length > 0);
                  if (gapRows.length === 0) return null;
                  return (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#6e6e73",
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                          margin: "14px 0 8px",
                        }}
                      >
                        영역별 부족 항목
                      </div>
                      {gapRows.map((s) => (
                        <div
                          key={s.label}
                          style={{
                            marginBottom: 8,
                            fontSize: 12,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "#1d1d1f", marginRight: 4 }}>
                            {s.label} ({s.score})
                          </span>
                          {s.gaps.map((g) => (
                            <span
                              key={g}
                              style={{
                                fontSize: 11.5,
                                fontWeight: 600,
                                color: "#c05a1e",
                                background: "rgba(224,120,60,0.1)",
                                border: "1px solid rgba(224,120,60,0.25)",
                                borderRadius: 999,
                                padding: "3px 9px",
                              }}
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      ))}
                    </>
                  );
                })()}
            </div>
          </div>
        ) : r ? (
          <div style={groupStyle}>
            <GroupTitle>진단 결과 (JSON)</GroupTitle>
            <pre
              style={{
                background: "#1d1d1f",
                color: "#d2d2d7",
                fontFamily: "ui-monospace,Menlo,monospace",
                fontSize: 12,
                borderRadius: 10,
                padding: 14,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(r, null, 2)}
            </pre>
          </div>
        ) : null}

        {/* Step 1 · 기본 정보 */}
        <div style={groupStyle}>
          <GroupTitle>Step 1 · 기본 정보</GroupTitle>
          <InfoRow label="담당자명" value={d.contact_name} />
          <InfoRow label="회사명" value={d.company_name} />
          <InfoRow label="직책" value={d.position} />
          <InfoRow label="이메일" value={d.email} />
          <InfoRow label="전화번호" value={d.phone} />
          <InfoRow label="홈페이지" value={d.homepage_url} />
          <InfoRow label="스마트스토어" value={d.smart_store_url} />
          <InfoRow label="인스타그램" value={d.instagram_url} />
          <InfoRow label="매출 규모" value={d.annual_revenue_range} />
        </div>

        {/* Step 2 · 제품 정보 */}
        <div style={groupStyle}>
          <GroupTitle>Step 2 · 제품 정보</GroupTitle>
          <InfoRow label="대표 제품명" value={d.product_name} />
          <InfoRow label="카테고리" value={d.product_category} />
          <InfoRow label="INCI 보유" value={d.has_inci} />
          <InfoRow label="용량/가격대" value={d.volume_and_price_range} />
          <InfoRow label="국내 판매" value={d.is_selling_in_korea} />
          <InfoRow label="월 판매량" value={d.monthly_sales_or_best_seller} />
          <InfoRow label="인증" value={d.certifications} />
          <InfoRow label="EU 규제 준비" value={d.eu_compliance_readiness} />
          <InfoRow label="포장(PPWR) 준비" value={d.packaging_readiness} />
          <div style={{ display: "flex", gap: 14, padding: "7px 0", fontSize: 14 }}>
            <div style={{ flex: "0 0 34%", color: "#6e6e73", fontWeight: 600 }}>첨부 파일</div>
            <div style={{ flex: 1 }}>
              {files.length > 0 ? (
                files.map((f, i) => (
                  <a
                    key={i}
                    href={f.fileUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      margin: "2px 6px 2px 0",
                      fontSize: 13,
                      color: "#0066cc",
                      fontWeight: 600,
                      background: "rgba(0,102,204,0.07)",
                      padding: "4px 10px",
                      borderRadius: 7,
                    }}
                  >
                    📎 {f.fileName || "첨부"}
                  </a>
                ))
              ) : (
                <span style={{ color: "#b0b0b5" }}>없음</span>
              )}
            </div>
          </div>
        </div>

        {/* Step 3 · 수출 목표 및 현재 상태 */}
        <div style={groupStyle}>
          <GroupTitle>Step 3 · 수출 목표 및 현재 상태</GroupTitle>
          <InfoRow label="목표 국가" value={d.target_countries} />
          <InfoRow label="희망 채널" value={d.preferred_channels} />
          <InfoRow label="수출 경험" value={d.export_experience} />
          <InfoRow label="박람회 경험" value={d.trade_fair_experience} />
          <InfoRow label="기존 바이어" value={d.has_existing_buyer} />
          <InfoRow label="가장 어려운 부분" value={d.pain_points} />
        </div>

        {/* 관리 · 진단 상태 */}
        <div style={groupStyle}>
          <GroupTitle>관리 · 진단 상태</GroupTitle>
          <InfoRow label="제출일" value={fmtDate(d.submitted_at)} />
          <AdminMeta id={d.id} initialStatus={d.diagnosis_status} initialMemo={d.admin_memo || ""} />
        </div>

        {/* 컨설팅 진행 트랙 */}
        <div style={groupStyle}>
          <GroupTitle>컨설팅 진행 트랙</GroupTitle>
          <ConsultingTrack
            id={d.id}
            initialStage={d.consulting_stage || CONSULTING_STAGES[0].key}
            initialChecklist={d.consulting_checklist ?? {}}
            initialNotes={d.consulting_notes || ""}
          />
        </div>

        {/* 예정 미팅 */}
        <div style={groupStyle}>
          <GroupTitle>예정 미팅 (온/오프라인)</GroupTitle>
          <Meetings id={d.id} meetings={d.meetings ?? []} />
        </div>
      </div>
    </main>
  );
}
