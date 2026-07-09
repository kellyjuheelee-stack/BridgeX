// web/app/(member)/tools/reply/ReplyTool.tsx
"use client";

import { useState } from "react";
import { runReplyAssist, type ReplyAssistResult } from "./actions";
import styles from "../tools.module.css";

// 전문가 협상 준비 CTA 타깃 (mypage 의 consulting 링크와 동일 패턴: /diagnose/result/{id})
const STEP_CONTEXT = "바이어 답장 대응·협상 준비";

export default function ReplyTool() {
  const [buyerName, setBuyerName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReplyAssistResult | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  async function run() {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      const r = await runReplyAssist(t, buyerName);
      setResult(r);
      setSubject(r.draft.subject);
      setBody(r.draft.body);
    } finally {
      setBusy(false);
    }
  }

  function copy(v: string) {
    navigator.clipboard.writeText(v).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  const consultHref = result?.diagnosisId ? `/diagnose/result/${result.diagnosisId}` : "/diagnose";

  return (
    <>
      <div className={styles.card}>
        <h2>1. 받은 답장 붙여넣기</h2>
        <div className={styles.chSub}>바이어가 보낸 이메일 내용을 그대로 붙여넣으세요. (영문·국문 모두 가능)</div>
        <label className={styles.fl}>바이어 담당자 이름 (선택)</label>
        <input
          className={styles.txt}
          type="text"
          placeholder="예: Marie Dubois"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
        />
        <label className={styles.fl}>
          받은 답장 내용 <span style={{ color: "#0066cc" }}>*</span>
        </label>
        <textarea
          className={styles.textarea}
          style={{ minHeight: 180 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예: Hi, we're interested. Could you share your price list, MOQ and send some samples? Do you have CPNP documentation?"
        />
        <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} onClick={run}>
          {busy ? "분석 중…" : "대응 초안 만들기 →"}
        </button>
      </div>

      {result && (
        <div className={styles.card}>
          <h2>2. 분석 + 대응 초안</h2>
          <div className={styles.chSub}>바이어가 요청한 것으로 감지된 항목입니다.</div>
          <div className={styles.intents}>
            {result.intents.length ? (
              result.intents.map((i) => (
                <span key={i.key} className={styles.intentChip}>
                  {i.label}
                </span>
              ))
            ) : (
              <span className={styles.intentNone}>특정 요청은 감지되지 않았습니다. 기본 대응 초안을 드립니다.</span>
            )}
          </div>

          <div className={styles.draftLabel}>제목</div>
          <input className={styles.draftInput} type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <div className={styles.draftLabel}>본문 (편집 가능)</div>
          <textarea className={styles.draftBody} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className={styles.copyrow}>
            <button className={styles.btnGhost} onClick={() => copy(subject)}>
              제목 복사
            </button>
            <button className={styles.btnGhost} onClick={() => copy(body)}>
              본문 복사
            </button>
            <button className={styles.btnGhost} onClick={() => copy(`Subject: ${subject}\n\n${body}`)}>
              전체 복사
            </button>
            {copied && <span className={styles.copied}>✓ 복사됨</span>}
          </div>

          {result.tips.length > 0 && (
            <div className={styles.tips}>
              <h3>💡 대응 팁</h3>
              <ul>
                {result.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {result.needsExpert && (
            <div className={styles.wall}>
              <h3>여기서부터는 전문가와.</h3>
              <p>
                가격·거래조건·미팅은 협상 단계입니다. 잘못 답하면 마진과 계약 조건이 불리해질 수 있어요. 대표님 브랜드에 맞춰 함께 준비하는 것을 권장합니다.
              </p>
              <a className={styles.wallBtn} href={consultHref} title={STEP_CONTEXT}>
                전문가와 협상 준비하기 →
              </a>
            </div>
          )}

          <div className={styles.tips} style={{ background: "rgba(0,0,0,0.035)", marginTop: 14 }}>
            <p style={{ fontSize: 12, color: "#6e6e73", lineHeight: 1.6, margin: 0 }}>
              이 초안은 시작점입니다. 바이어·상황에 맞게 다듬은 뒤 본인 메일함에서 발송하세요. (BridgeX는 발송하지 않습니다.)
            </p>
          </div>
        </div>
      )}
    </>
  );
}
