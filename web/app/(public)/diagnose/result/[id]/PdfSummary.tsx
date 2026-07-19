// web/app/(public)/diagnose/result/[id]/PdfSummary.tsx
// 인쇄 전용 1페이지 요약 대시보드. 결과 페이지(인쇄)와 샘플 미리보기(화면)에서 공용으로 재사용.
import type { DiagnosisResult } from "@/lib/services/diagnosis/types";
import { EU_ITEMS, PACKAGING_ITEMS } from "@/lib/services/diagnosis/generateDiagnosis";
import styles from "./result.module.css";

export default function PdfSummary({
  companyName,
  result,
  answers,
}: {
  companyName: string;
  result: DiagnosisResult;
  answers: Record<string, boolean> | null;
}) {
  const r = result;
  const euItems = EU_ITEMS.map((it) => ({
    label: it.label,
    ok: answers ? !!answers[it.key] : !r.euStatus.missing.includes(it.label),
  }));
  const pkgItems = PACKAGING_ITEMS.map((it) => ({ label: it.label, ok: !!answers?.[it.key] }));
  const pkgHave = pkgItems.filter((x) => x.ok).length;
  const hasPkgData = answers != null;
  const sections = Object.values(r.sections);
  const missingCount = r.euStatus.missing.length;

  return (
    <section className={styles.pdfSummary} aria-hidden="true">
      {/* 헤더: 타이틀 + 종합 점수 링 */}
      <header className={styles.pHead}>
        <div className={styles.pHeadMain}>
          <p className={styles.pEyebrow}>수출 준비도 진단 · EU</p>
          <h1 className={styles.pTitle}>{companyName}의 유럽 수출 준비도</h1>
        </div>
        <div className={styles.pScore}>
          <svg className={styles.pRing} viewBox="0 0 120 120" role="img" aria-label={`종합 ${r.overallScore}점`}>
            <circle className={styles.pRingTrack} cx="60" cy="60" r="52" />
            <circle
              className={styles.pRingVal}
              cx="60"
              cy="60"
              r="52"
              strokeDasharray="326.726"
              strokeDashoffset={326.726 * (1 - r.overallScore / 100)}
            />
            <text className={styles.pRingNum} x="60" y="61" textAnchor="middle" dominantBaseline="central">
              {r.overallScore}
            </text>
          </svg>
          <span className={styles.pBand}>{r.readinessLevel}</span>
          <span className={styles.pNeed}>
            컨설팅 필요도 <b>{r.consultingNeed.level}</b>
          </span>
        </div>
      </header>

      {/* KPI 카드 4종 */}
      <div className={styles.pKpis}>
        <div className={styles.pCard}>
          <p className={styles.pKpiLabel}>종합 준비도</p>
          <div className={styles.pKpiVal}>
            {r.overallScore}
            <small>/100</small>
          </div>
          <p className={styles.pKpiFoot}>{r.readinessLevel}</p>
        </div>
        <div className={styles.pCard}>
          <p className={styles.pKpiLabel}>EU 필수 요건</p>
          <div className={styles.pKpiVal}>
            {r.euStatus.haveCount}
            <small>/{r.euStatus.total}</small>
          </div>
          <p className={styles.pKpiFoot}>{missingCount > 0 ? `${missingCount}개 미비` : "충족"}</p>
        </div>
        <div className={styles.pCard}>
          <p className={styles.pKpiLabel}>포장 규제 PPWR</p>
          <div className={styles.pKpiVal}>
            {hasPkgData ? pkgHave : "—"}
            <small>/4</small>
          </div>
          <p className={styles.pKpiFoot}>2026.8 시행</p>
        </div>
        <div className={styles.pCard}>
          <p className={styles.pKpiLabel}>우선 과제</p>
          <div className={styles.pKpiVal}>
            {r.priorities.length}
            <small>건</small>
          </div>
          <p className={styles.pKpiFoot}>아래 참조</p>
        </div>
      </div>

      {/* 영역별 준비도 (미터 바) */}
      <h2 className={styles.pSecTitle}>영역별 준비도</h2>
      <div className={styles.pAxes}>
        {sections.map((s) => (
          <div key={s.label} className={styles.pAxisCard}>
            <div className={styles.pAxisTop}>
              <span className={styles.pAxisLabel}>{s.label}</span>
              <span className={styles.pAxisNum}>{s.score}</span>
            </div>
            <div className={styles.pMeter}>
              <span style={{ width: `${s.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* EU 요건 상세 + 우선 해결 과제 */}
      <div className={styles.pGrid2}>
        <div className={styles.pCard}>
          <div className={styles.pCardHead}>
            <h3 className={styles.pCardTitle}>EU 필수 요건</h3>
            <span className={styles.pChip}>
              {r.euStatus.haveCount}/{r.euStatus.total} 확보
            </span>
          </div>
          <div className={styles.pSeg}>
            {euItems.map((it, i) => (
              <span key={i} className={it.ok ? `${styles.pSegCell} ${styles.pSegOn}` : styles.pSegCell} />
            ))}
          </div>
          <ul className={styles.pReqList}>
            {euItems.map((it) => (
              <li key={it.label} className={it.ok ? styles.pReq : `${styles.pReq} ${styles.pReqMiss}`}>
                <span className={it.ok ? styles.pReqDot : `${styles.pReqDot} ${styles.pReqDotMiss}`} />
                {it.label}
                {!it.ok && <span className={styles.pMissTag}>미비</span>}
              </li>
            ))}
          </ul>
          {hasPkgData && (
            <p className={styles.pPpwr}>포장 규제(PPWR) {pkgHave}/4 확보 · 2026.8 시행 대응 필요</p>
          )}
        </div>
        <div className={styles.pCard}>
          <h3 className={styles.pCardTitle}>우선 해결 과제</h3>
          {r.priorities.length > 0 ? (
            <ol className={styles.pPrio}>
              {r.priorities.slice(0, 3).map((p, i) => (
                <li key={p.label} className={styles.pPrioItem}>
                  <span className={styles.pRank}>{i + 1}</span>
                  <div>
                    <b className={styles.pPrioLabel}>{p.label}</b>
                    <span className={styles.pPrioNote}>{p.note}</span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.pOk}>추가 우선 과제 없음</p>
          )}
        </div>
      </div>

      {/* 액션 플랜 타임라인 */}
      <div className={`${styles.pCard} ${styles.pTlCard}`}>
        <h3 className={styles.pCardTitle}>액션 플랜</h3>
        <ol className={styles.pTimeline}>
          {r.nextActions.slice(0, 4).map((a, i) => (
            <li key={i} className={styles.pTlItem}>
              <span className={styles.pTlDot}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.pTlText}>{a}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
