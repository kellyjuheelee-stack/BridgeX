// web/app/(member)/tools/catalog/CatalogTool.tsx
"use client";

import { useState } from "react";
import type { AuditResult } from "@/lib/services/catalog/audit";
import { runCatalogAudit } from "./actions";
import styles from "../tools.module.css";

// 전문가 상담 CTA 타깃 (mypage 의 consulting 링크와 동일 패턴: /diagnose/result/{id})
const STEP_CONTEXT = "카탈로그 컴플라이언스 검토";

export default function CatalogTool({ diagnosisId }: { diagnosisId: string | null }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  async function run() {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      const r = await runCatalogAudit(t);
      setResult(r);
    } finally {
      setBusy(false);
    }
  }

  const consultHref = diagnosisId ? `/diagnose/result/${diagnosisId}` : "/diagnose";
  const n = result?.summary.flaggedCount ?? 0;

  return (
    <>
      <div className={styles.card}>
        <h2>1. 점검할 문구 붙여넣기</h2>
        <div className={styles.chSub}>영문·국문 모두 가능합니다. 제품 설명, 효능 문구, 마케팅 카피를 붙여넣으세요.</div>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예: 이 제품은 미백과 주름 개선에 효과적이며, 여드름 치료를 도와줍니다…"
        />
        <div className={styles.disclaimer}>
          본 점검은 공개된 EU 화장품 가이드라인 기반 <b>일반 교육 정보</b>이며, 법률 자문이나 공식 규제 판단이 아닙니다. 최종 확정 전 반드시 전문 규제 컨설턴트와 상의하세요.
        </div>
        <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} onClick={run}>
          {busy ? "점검 중…" : "EU 관점으로 점검하기 →"}
        </button>
      </div>

      {result && (
        <div className={styles.card}>
          <h2>2. 점검 결과</h2>
          <div className={styles.chSub}>
            {n > 0 ? `검토를 권장하는 표현 ${n}개를 찾았습니다.` : "눈에 띄는 위험 표현은 발견되지 않았습니다."}
          </div>

          {n > 0 ? (
            result.findings.map((f) => (
              <div key={f.key} className={styles.finding}>
                <div className={styles.fc}>
                  <span className={styles.fbadge}>검토 권장</span>
                  <span className={styles.fcat}>{f.category}</span>
                </div>
                <div className={styles.fmatch}>
                  발견:{" "}
                  {f.matched.map((m, i) => (
                    <span key={i}>
                      {i > 0 ? " " : ""}
                      <b>{m}</b>
                    </span>
                  ))}
                </div>
                <div className={styles.fwhy}>{f.why}</div>
                <div className={styles.fhint}>💡 {f.hint}</div>
              </div>
            ))
          ) : (
            <div className={styles.clean}>
              ✓ 자주 지적되는 표현은 발견되지 않았습니다. 다만 이는 예비 점검이며, 정확한 판단은 전문가 확인이 필요합니다.
            </div>
          )}

          <h2 style={{ marginTop: 22 }}>바이어레디 체크</h2>
          <div className={styles.chSub}>EU B2B 자료에 흔히 필요한 요소가 문구에 보이는지 확인합니다. (신호 기반 추정)</div>
          {result.buyerReady.map((b) => (
            <div key={b.item} className={styles.brRow}>
              <span className={styles.brIc}>{b.present ? "✅" : "⬜"}</span>
              <span className={styles.brItem}>{b.item}</span>
              <span className={styles.brNote}>{b.present ? "문구에서 확인됨" : b.note}</span>
            </div>
          ))}

          <div className={styles.disclaimer}>{result.disclaimer}</div>

          <div className={styles.wall}>
            <h3>정확한 판단은 전문가와.</h3>
            <p>
              이 점검은 예비 참고용입니다. 실제 표현 수정·규제 적합성은 대표님 브랜드에 맞춘 전문가 검토가 필요합니다.
            </p>
            <a className={styles.wallBtn} href={consultHref} title={STEP_CONTEXT}>
              전문가에게 카탈로그 검토 요청 →
            </a>
          </div>
        </div>
      )}
    </>
  );
}
