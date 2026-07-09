// web/app/(member)/mypage/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { signOut } from "@/app/auth/actions";
import { buildRoadmap } from "@/lib/services/roadmap/buildRoadmap";
import { toRoadmapDiagnosis } from "@/lib/services/roadmap/fromRow";
import type { RoadmapProgress, StepPhase } from "@/lib/services/roadmap/types";
import type { DiagnosisResult } from "@/lib/services/diagnosis/types";
import RoadmapToggle from "./RoadmapToggle";
import styles from "./mypage.module.css";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  submitted: "접수됨",
  reviewing: "검토 중",
  ai_generated: "진단 완료",
  consulting_needed: "상담 신청됨",
  completed: "컨설팅 완료",
  archived: "종료",
};

const PHASE_LABELS: Record<StepPhase, string> = {
  foundation: "기반 · 제품/규제",
  sales: "영업 자료",
  buyer: "바이어",
};

// 레거시 도구 링크(*.html) → 새 라우트
const TOOL_HREF: Record<string, string> = {
  "email.html": "/tools/email",
  "reply.html": "/tools/reply",
  "catalog.html": "/tools/catalog",
};

function scoreColor(s: number): string {
  return s >= 75 ? "#2e9e6b" : s >= 55 ? "#0071e3" : "#d68e2e";
}
function fmtDate(s?: string | null): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "-";
  return (
    d.getFullYear() +
    "." +
    String(d.getMonth() + 1).padStart(2, "0") +
    "." +
    String(d.getDate()).padStart(2, "0")
  );
}

interface DiagnosisRow {
  id: string;
  product_name: string | null;
  submitted_at: string | null;
  diagnosis_status: string;
  diagnosis_result: DiagnosisResult | null;
  consultation_requested: boolean;
  eu_compliance_readiness: string[] | null;
  packaging_readiness: string[] | null;
  is_selling_in_korea: string | null;
  certifications: string[] | null;
  product_files: unknown[] | null;
}

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();

  const { data: profile } = await svc
    .from("profiles")
    .select("name, company_name, phone, created_at, roadmap_progress")
    .eq("id", user.id)
    .single();

  const { data: latest } = await svc
    .from("export_diagnosis_requests")
    .select(
      "id, product_name, submitted_at, diagnosis_status, diagnosis_result, consultation_requested, eu_compliance_readiness, packaging_readiness, is_selling_in_korea, certifications, product_files"
    )
    .eq("member_id", user.id)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle<DiagnosisRow>();

  const name = profile?.name || "";
  const companyName = profile?.company_name || "";
  const progress = (profile?.roadmap_progress ?? {}) as RoadmapProgress;

  const result = latest?.diagnosis_result ?? null;
  const roadmap = latest ? buildRoadmap(toRoadmapDiagnosis(latest), progress) : null;

  const kpiScore =
    result && typeof result.overallScore === "number" ? String(result.overallScore) : latest ? "—" : "진단 전";
  const kpiProgress = roadmap ? roadmap.progress.percent + "%" : "—";
  const kpiExpert = roadmap ? String(roadmap.progress.expertRemaining) : "—";
  const expertWarn = !!roadmap && roadmap.progress.expertRemaining > 0;

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a href="/" className={styles.logo}>
          Bridge<span>X</span>
        </a>
        <div className={styles.navRight}>
          <a href="/" className={styles.navLink}>
            홈
          </a>
          <form action={signOut}>
            <button type="submit" className={styles.navLink}>
              로그아웃
            </button>
          </form>
        </div>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.hello}>
          <h1>
            <span>{name}</span>님, 환영합니다.
          </h1>
          <p>{companyName}</p>
        </div>

        {/* KPI strip */}
        <div className={styles.kpiStrip}>
          <div className={styles.kpi}>
            <div className={styles.kpiVal}>{kpiScore}</div>
            <div className={styles.kpiLabel}>수출 준비도</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiVal}>{kpiProgress}</div>
            <div className={styles.kpiLabel}>로드맵 진행률</div>
          </div>
          <div className={styles.kpi}>
            <div className={`${styles.kpiVal} ${expertWarn ? styles.warn : ""}`}>{kpiExpert}</div>
            <div className={styles.kpiLabel}>전문가 필요 단계</div>
          </div>
        </div>

        {/* 진단 현황 */}
        <div className={styles.card}>
          <h2>내 수출 진행 현황</h2>
          {!latest ? (
            <>
              <div className={styles.placeholder}>
                <div className={styles.phIco}>📋</div>
                <h3>아직 진단 이력이 없습니다</h3>
                <p>수출 가능성 진단을 받으면 결과와 진행 상황이 여기에 저장됩니다.</p>
              </div>
              <div className={styles.ctaRow}>
                <a href="/diagnose" className={`${styles.btn} ${styles.btnPrimary}`}>
                  우리 브랜드 수출 가능성 진단하기
                </a>
                <a href="/" className={`${styles.btn} ${styles.btnGhost}`}>
                  홈으로
                </a>
              </div>
            </>
          ) : (
            <>
              <div className={styles.dgHead}>
                <div>
                  <span className={`${styles.badge} ${styles["st-" + latest.diagnosis_status] ?? ""}`}>
                    {STATUS_LABELS[latest.diagnosis_status] || latest.diagnosis_status}
                  </span>
                  <span className={styles.dgMeta}>
                    {latest.product_name || ""} · {fmtDate(latest.submitted_at)}
                  </span>
                </div>
              </div>

              {result && typeof result.overallScore === "number" && (
                <>
                  <div className={styles.dgHero}>
                    <div
                      className={styles.dgRing}
                      style={{
                        background: `conic-gradient(${scoreColor(result.overallScore)} ${
                          result.overallScore * 3.6
                        }deg, #ececef 0deg)`,
                      }}
                    >
                      <div className={styles.dgRingIn}>
                        <span className={styles.dgNum}>{result.overallScore}</span>
                        <span className={styles.dgDen}>/100</span>
                      </div>
                    </div>
                    <div className={styles.dgSide}>
                      <div className={styles.dgLevel} style={{ color: scoreColor(result.overallScore) }}>
                        {result.readinessLevel || ""}
                      </div>
                      <p className={styles.dgSummary}>{result.summary || ""}</p>
                    </div>
                  </div>

                  {result.sections && (
                    <div className={styles.dgDims}>
                      {Object.values(result.sections).map((s) => (
                        <div key={s.label}>
                          <div className={styles.dgDimTop}>
                            <span>{s.label}</span>
                            <span style={{ color: scoreColor(s.score) }}>{s.score}</span>
                          </div>
                          <div className={styles.dgTrack}>
                            <div
                              className={styles.dgFill}
                              style={{ width: `${s.score}%`, background: scoreColor(s.score) }}
                            />
                          </div>
                          {s.gaps && s.gaps.length > 0 && (
                            <div className={styles.dgGaps}>
                              {s.gaps.map((g) => (
                                <span key={g} className={styles.gapChip}>
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.priorities && result.priorities.length > 0 && (
                    <div className={styles.prioBox}>
                      <h4>가장 먼저 해결할 과제 Top {result.priorities.length}</h4>
                      {result.priorities.map((p, i) => (
                        <div key={p.label} className={styles.prioItem}>
                          <span className={styles.prioNum}>{i + 1}</span>
                          <div>
                            <div className={styles.prioLabel}>{p.label}</div>
                            <div className={styles.prioNote}>{p.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {latest.consultation_requested && (
                <div className={styles.dgConsult}>
                  🔥 상담 신청 완료 — 담당 전문가가 곧 연락드립니다.
                </div>
              )}

              <div className={styles.ctaRow}>
                <a href="/diagnose" className={`${styles.btn} ${styles.btnGhost}`}>
                  새 진단 받기
                </a>
              </div>
            </>
          )}
        </div>

        {/* 로드맵 */}
        {roadmap && (
          <div className={styles.card}>
            <h2>내 수출 실행 로드맵</h2>
            <div className={styles.rmTop}>
              <span className={styles.rmPct}>{roadmap.progress.percent}%</span>
              <span className={styles.rmSub}>
                {roadmap.progress.total}단계 중 {roadmap.progress.doneCount}단계 완료
              </span>
              {roadmap.progress.expertRemaining > 0 && (
                <span className={styles.rmWall}>
                  🔴 {roadmap.progress.expertRemaining}단계는 전문가가 필요합니다
                </span>
              )}
            </div>
            <div className={styles.rmBar}>
              <div className={styles.rmBarFill} style={{ width: `${roadmap.progress.percent}%` }} />
            </div>

            {(["foundation", "sales", "buyer"] as StepPhase[]).map((ph) => {
              const group = roadmap.steps.filter((s) => s.phase === ph);
              if (!group.length) return null;
              return (
                <div key={ph}>
                  <div className={styles.rmPhase}>{PHASE_LABELS[ph] || ph}</div>
                  {group.map((s) => {
                    const isSoon = s.link.type === "soon";
                    return (
                      <div key={s.id} className={styles.rmStep}>
                        {isSoon ? (
                          <div
                            className={styles.rmCheck}
                            style={{ cursor: "default", opacity: 0.4 }}
                            title="준비 중"
                          />
                        ) : (
                          <RoadmapToggle stepId={s.id} done={s.done} />
                        )}
                        <div className={styles.rmMain}>
                          <div className={`${styles.rmTitle} ${s.done ? styles.done : ""}`}>
                            {s.title}
                          </div>
                          <div className={styles.rmCmt}>{s.comment}</div>
                          {s.link.type === "tool" && s.link.href && (
                            <div className={styles.rmAct}>
                              <a
                                className={styles.rmLink}
                                href={TOOL_HREF[s.link.href] || "#"}
                              >
                                도구 열기 →
                              </a>
                            </div>
                          )}
                          {s.link.type === "consulting" && latest && (
                            <div className={styles.rmAct}>
                              <a
                                className={styles.rmLink}
                                href={`/diagnose/result/${latest.id}`}
                              >
                                상담 신청 →
                              </a>
                            </div>
                          )}
                          {isSoon && (
                            <div className={styles.rmAct}>
                              <span className={styles.rmSoon}>{s.link.label || "준비 중"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* AI 실무 도구 */}
        <div className={styles.card}>
          <h2>AI 실무 도구</h2>
          <p className={styles.toolSub}>수출 실무를 AI가 함께합니다. 필요할 때 바로 여세요.</p>
          <div className={styles.toolGrid}>
            <a href="/tools/email" className={styles.tool}>
              <div className={styles.toolIco}>✉️</div>
              <div className={styles.toolName}>AI 이메일 작성</div>
              <div className={styles.toolDesc}>콜드·박람회 후속 등 상황별 영문 이메일 초안</div>
            </a>
            <a href="/tools/reply" className={styles.tool}>
              <div className={styles.toolIco}>💬</div>
              <div className={styles.toolName}>바이어 답장 대응</div>
              <div className={styles.toolDesc}>받은 답장을 분석해 맞춤 영문 대응 초안</div>
            </a>
            <a href="/tools/catalog" className={styles.tool}>
              <div className={styles.toolIco}>🧴</div>
              <div className={styles.toolName}>카탈로그 EU 점검</div>
              <div className={styles.toolDesc}>문구가 EU에서 문제될 소지를 예비 점검</div>
            </a>
          </div>
        </div>

        {/* 내 정보 */}
        <div className={styles.card}>
          <h2>내 정보</h2>
          <div className={styles.prow}>
            <div className={styles.pk}>이름</div>
            <div className={styles.pv}>{name}</div>
          </div>
          <div className={styles.prow}>
            <div className={styles.pk}>회사명</div>
            <div className={styles.pv}>{companyName}</div>
          </div>
          <div className={styles.prow}>
            <div className={styles.pk}>이메일</div>
            <div className={styles.pv}>{user.email}</div>
          </div>
          <div className={styles.prow}>
            <div className={styles.pk}>전화번호</div>
            <div className={styles.pv}>{profile?.phone || ""}</div>
          </div>
          <div className={styles.prow}>
            <div className={styles.pk}>가입일</div>
            <div className={styles.pv}>{fmtDate(profile?.created_at)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
