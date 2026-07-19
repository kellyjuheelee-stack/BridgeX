// web/app/(public)/diagnose/result/[id]/page.tsx
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { CSSProperties } from "react";
import type { DiagnosisResult, SectionResult } from "@/lib/services/diagnosis/types";
import { EU_ITEMS, PACKAGING_ITEMS } from "@/lib/services/diagnosis/generateDiagnosis";
import ResultActions from "./ResultActions";
import DownloadPdfButton from "./DownloadPdfButton";
import PdfSummary from "./PdfSummary";
import HomeButton from "@/app/HomeButton";
import { DIAGNOSE_EXAMPLES } from "../../exampleData";
import styles from "./result.module.css";

// 샘플('샘플 보기')로 생성된 결과 판별 — 예제 데이터의 고유 가상 이메일과 일치하면 샘플.
// (실고객은 이 더미 이메일을 쓰지 않으므로 DB 플래그 없이 코드로만 구분)
const SAMPLE_EMAILS = new Set(DIAGNOSE_EXAMPLES.map((e) => e.email.toLowerCase()));

const CheckMark = () => (
  <svg className={styles.mark} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="9" fill="var(--blue)" />
    <path
      d="M6 10.5l2.5 2.5L14 7.5"
      fill="none"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const MissMark = () => (
  <svg className={styles.mark} viewBox="0 0 20 20" aria-hidden="true">
    <circle
      cx="10"
      cy="10"
      r="8.25"
      fill="none"
      stroke="var(--muted-2)"
      strokeWidth="1.5"
      strokeDasharray="2.4 2.4"
    />
  </svg>
);

function Gauge({ s, weakest }: { s: SectionResult; weakest: boolean }) {
  return (
    <div className={`${styles.card} ${styles.gauge}`}>
      <svg className={styles.ring} viewBox="0 0 120 120" role="img" aria-label={`${s.label} ${s.score}점`}>
        <title>{`${s.label} · ${s.score} / 100`}</title>
        <circle className={styles.ringTrack} cx="60" cy="60" r="52" />
        <circle
          className={styles.ringVal}
          cx="60"
          cy="60"
          r="52"
          style={{ "--v": s.score } as CSSProperties}
        />
        <text className={styles.ringNum} x="60" y="60" textAnchor="middle" dominantBaseline="central">
          {s.score}
        </text>
      </svg>
      <p className={styles.gLabel}>{s.label}</p>
      <p className={styles.gNote}>{s.comment}</p>
      {weakest && <span className={styles.tag}>최우선 보강 영역</span>}
    </div>
  );
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createServiceClient();
  const { data: row } = await admin
    .from("export_diagnosis_requests")
    .select(
      "id, email, contact_name, company_name, phone, member_id, diagnosis_result, checklist_answers"
    )
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
  // 샘플 결과면 상담 CTA·회원가입 카드를 숨긴다(실고객 결과에는 그대로 노출).
  const isSample = SAMPLE_EMAILS.has(String(row.email ?? "").toLowerCase());

  // 원본 응답(있으면)으로 EU 7요건·PPWR 항목별 확보/미비 복원
  const answers = (row.checklist_answers ?? null) as Record<string, boolean> | null;
  const euItems = EU_ITEMS.map((it) => ({
    label: it.label,
    ok: answers ? !!answers[it.key] : !r.euStatus.missing.includes(it.label),
  }));
  const pkgItems = PACKAGING_ITEMS.map((it) => ({ label: it.label, ok: !!answers?.[it.key] }));
  const pkgHave = pkgItems.filter((x) => x.ok).length;
  const hasPkgData = answers != null;

  const sections = Object.values(r.sections);
  const weakest = sections.reduce((a, b) => (b.score < a.score ? b : a));
  const missingCount = r.euStatus.missing.length;

  return (
    <main className={styles.page}>
      <HomeButton />
      <div className={styles.wrap}>
        {/* TOOLBAR — 샘플 결과에는 PDF 다운로드 버튼도 숨긴다. */}
        {!isSample && (
          <div className={styles.toolbar}>
            <DownloadPdfButton companyName={row.company_name as string} />
          </div>
        )}

        {/* PDF 요약 — 인쇄 전용 세로 1페이지 (대시보드 카드 레이아웃 · design.md 스타일, 화면에서는 숨김) */}
        <PdfSummary companyName={row.company_name as string} result={r} answers={answers} />

        {/* 화면 표시 콘텐츠 (인쇄 시 숨김) */}
        <div className={styles.screenContent}>
        {/* HEADER */}
        <header className={styles.head}>
          <div>
            <p className={styles.eyebrow}>수출 준비도 진단 · EU</p>
            <h1 className={styles.title}>
              <span className={styles.brand}>{row.company_name as string}</span>의 유럽 수출 준비도
            </h1>
            <p className={styles.sub}>{r.summary}</p>
          </div>
          <div className={styles.scoreBlock}>
            <div className={styles.scoreNum}>
              {r.overallScore}
              <small> / 100</small>
            </div>
            <div className={styles.scoreMeta}>
              <span className={styles.band}>
                <span className={styles.bandDot} />
                {r.readinessLevel}
              </span>
              <span className={styles.needLine}>
                컨설팅 필요도 <b>{r.consultingNeed.level}</b>
              </span>
            </div>
          </div>
        </header>

        {/* KPI ROW */}
        <section className={styles.section}>
          <div className={styles.kpis}>
            <div className={`${styles.card}`}>
              <p className={styles.kpiLabel}>종합 준비도</p>
              <div className={styles.kpiValue}>
                {r.overallScore}
                <small> / 100</small>
              </div>
              <p className={styles.kpiFoot}>{r.readinessLevel}</p>
            </div>
            <div className={`${styles.card}`}>
              <p className={styles.kpiLabel}>EU 필수 요건</p>
              <div className={styles.kpiValue}>
                {r.euStatus.haveCount}
                <small> / {r.euStatus.total}</small>
              </div>
              <p className={missingCount > 0 ? `${styles.kpiFoot} ${styles.kpiFootWarn}` : styles.kpiFoot}>
                {missingCount > 0 ? `${missingCount}개 미비 — 판매 전 필수` : "필수 요건 충족"}
              </p>
            </div>
            <div className={`${styles.card}`}>
              <p className={styles.kpiLabel}>EU 포장 규제 (PPWR)</p>
              <div className={styles.kpiValue}>
                {hasPkgData ? pkgHave : "—"}
                <small> / 4</small>
              </div>
              <p className={styles.kpiFoot}>2026.8 시행 대응 필요</p>
            </div>
            <div className={`${styles.card}`}>
              <p className={styles.kpiLabel}>우선 해결 과제</p>
              <div className={styles.kpiValue}>
                {r.priorities.length}
                <small> 건</small>
              </div>
              <p className={styles.kpiFoot}>아래 우선순위 참조</p>
            </div>
          </div>
        </section>

        {/* AXIS GAUGES */}
        <section className={styles.section}>
          <h2 className={styles.secTitle}>영역별 준비도</h2>
          <div className={styles.gauges}>
            {sections.map((s) => (
              <Gauge key={s.label} s={s} weakest={s.label === weakest.label} />
            ))}
          </div>
        </section>

        {/* EU DETAIL */}
        <section className={styles.section}>
          <h2 className={styles.secTitle}>EU 규제 상세</h2>
          <div className={styles.euGrid}>
            <div className={styles.card}>
              <div className={styles.segHead}>
                <h3>필수 7요건</h3>
                <span className={styles.segCount}>
                  <b>{r.euStatus.haveCount}</b> / {r.euStatus.total} 확보
                </span>
              </div>
              <div className={styles.segbar} aria-hidden="true">
                {euItems.map((it, i) => (
                  <span key={i} className={it.ok ? `${styles.seg} ${styles.segOn}` : styles.seg} />
                ))}
              </div>
              <ul className={styles.reqList}>
                {euItems.map((it) => (
                  <li key={it.label} className={it.ok ? styles.reqItem : `${styles.reqItem} ${styles.reqMiss}`}>
                    {it.ok ? <CheckMark /> : <MissMark />}
                    {it.label}
                    {!it.ok && <span className={styles.missTag}>미비</span>}
                  </li>
                ))}
              </ul>
            </div>

            {hasPkgData && (
              <div className={styles.card}>
                <div className={styles.segHead}>
                  <h3>포장 규제 (PPWR)</h3>
                  <span className={styles.segCount}>
                    <b>{pkgHave}</b> / 4 확보
                  </span>
                </div>
                <div className={styles.segbar} aria-hidden="true">
                  {pkgItems.map((it, i) => (
                    <span key={i} className={it.ok ? `${styles.seg} ${styles.segOn}` : styles.seg} />
                  ))}
                </div>
                <ul className={styles.reqList}>
                  {pkgItems.map((it) => (
                    <li key={it.label} className={it.ok ? styles.reqItem : `${styles.reqItem} ${styles.reqMiss}`}>
                      {it.ok ? <CheckMark /> : <MissMark />}
                      {it.label}
                      {!it.ok && <span className={styles.missTag}>미비</span>}
                    </li>
                  ))}
                </ul>
                <p className={styles.ppwrNote}>
                  2026년 8월 시행되는 EU 포장·포장폐기물 규정(PPWR)에 맞춘 대응 전략이 필요합니다.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* PRIORITIES */}
        {r.priorities.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.secTitle}>우선 해결 과제 · Top {r.priorities.length}</h2>
            <div className={styles.prio}>
              {r.priorities.map((p, i) => (
                <div key={p.label} className={styles.prioRow}>
                  <span className={styles.rank}>{i + 1}</span>
                  <div className={styles.prioBody}>
                    <h4>{p.label}</h4>
                    <p>{p.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* NEXT ACTIONS + CONSULTING CTA */}
        <section className={styles.section}>
          <div className={isSample ? `${styles.close} ${styles.closeSolo}` : styles.close}>
            <div className={styles.card}>
              <h2 className={styles.secTitle} style={{ marginTop: 0 }}>
                액션 플랜
              </h2>
              <ul className={styles.actionList}>
                {r.nextActions.map((a, i) => (
                  <li key={i} className={styles.actionItem}>
                    <span className={styles.actionN}>{String(i + 1).padStart(2, "0")}</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 샘플 결과에는 상담 CTA·회원가입 카드를 노출하지 않는다. */}
            {!isSample && (
              <div className={styles.noPrint}>
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
              </div>
            )}
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}
