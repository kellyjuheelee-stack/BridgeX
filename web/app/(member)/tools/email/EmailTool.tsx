// web/app/(member)/tools/email/EmailTool.tsx
"use client";

import { useState } from "react";
import type { EmailTemplateMeta } from "@/lib/services/email/templates";
import { generateEmailDraft } from "./actions";
import styles from "../tools.module.css";

export default function EmailTool({ templates }: { templates: EmailTemplateMeta[] }) {
  const [selected, setSelected] = useState<EmailTemplateMeta | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function selectSituation(t: EmailTemplateMeta) {
    setSelected(t);
    setInputs({});
    setErrors({});
    setDraft(null);
  }

  async function generate() {
    if (!selected) return;
    const missing: Record<string, boolean> = {};
    for (const f of selected.fields) {
      if (f.required && !(inputs[f.key] || "").trim()) missing[f.key] = true;
    }
    setErrors(missing);
    if (Object.keys(missing).length) return;

    setBusy(true);
    try {
      const trimmed: Record<string, string> = {};
      for (const f of selected.fields) trimmed[f.key] = (inputs[f.key] || "").trim();
      const res = await generateEmailDraft(selected.key, trimmed);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      setDraft({ subject: res.draft.subject, body: res.draft.body });
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <>
      <div className={styles.card}>
        <h2>1. 상황 선택</h2>
        <div className={styles.chSub}>보내려는 이메일의 상황을 고르세요.</div>
        <div className={styles.situations}>
          {templates.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.sit} ${selected?.key === t.key ? styles.sitOn : ""}`}
              onClick={() => selectSituation(t)}
            >
              <div className={styles.sitLabel}>{t.label}</div>
              <div className={styles.sitDesc}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className={styles.card}>
          <h2>2. 바이어 정보 입력</h2>
          <div className={styles.chSub}>{selected.label} — 아래 정보를 채워주세요.</div>
          <div className={styles.ctxnote}>
            ✓ 내 제품·회사·인증 정보는 진단 데이터에서 자동으로 채워집니다. 바이어 정보만 입력하세요.
          </div>
          {selected.fields.map((f) => (
            <div key={f.key} className={styles.field}>
              <label>
                {f.label}
                {f.required && <span className={styles.req}> *</span>}
              </label>
              <input
                type="text"
                placeholder={f.placeholder}
                value={inputs[f.key] || ""}
                style={errors[f.key] ? { borderColor: "#d64545" } : undefined}
                onChange={(e) => setInputs((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} onClick={generate}>
            {busy ? "생성 중…" : "영문 초안 생성 →"}
          </button>
        </div>
      )}

      {draft && (
        <div className={styles.card}>
          <h2>3. 이메일 초안 (편집 가능)</h2>
          <div className={styles.draftLabel}>제목</div>
          <input
            className={styles.draftInput}
            type="text"
            value={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
          />
          <div className={styles.draftLabel}>본문</div>
          <textarea
            className={styles.draftBody}
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          />
          <div className={styles.copyrow}>
            <button className={styles.btnGhost} onClick={() => copy(draft.subject)}>
              제목 복사
            </button>
            <button className={styles.btnGhost} onClick={() => copy(draft.body)}>
              본문 복사
            </button>
            <button className={styles.btnGhost} onClick={() => copy(`Subject: ${draft.subject}\n\n${draft.body}`)}>
              전체 복사
            </button>
            {copied && <span className={styles.copied}>✓ 복사됨</span>}
          </div>
          <div className={styles.tip}>
            💡 이 초안은 시작점입니다. 바이어·상황에 맞게 자유롭게 다듬은 뒤 본인 메일함에서 발송하세요. (BridgeX는 발송하지 않습니다.)
          </div>
        </div>
      )}
    </>
  );
}
