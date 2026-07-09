// web/app/(admin)/admin/leads/[id]/AdminMeta.tsx
// 진단 상태 + 관리자 메모 — admin.html 의 관리 박스(단일 '저장' 버튼) 포팅.
"use client";

import { useState, useTransition } from "react";
import { DIAGNOSIS_STATUSES, STATUS_LABELS } from "@/lib/constants/consulting";
import { saveAdminMeta } from "./actions";

export default function AdminMeta({
  id,
  initialStatus,
  initialMemo,
}: {
  id: string;
  initialStatus: string;
  initialMemo: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [memo, setMemo] = useState(initialMemo);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      await saveAdminMeta(id, { status, memo });
      setSaved(true);
    });
  };

  return (
    <div style={{ background: "#f5f5f7", borderRadius: 14, padding: 18, marginTop: 8 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6e6e73", marginBottom: 6 }}>
        진단 상태
      </label>
      <select
        value={status}
        onChange={(e) => {
          setSaved(false);
          setStatus(e.target.value);
        }}
        style={{
          width: "100%",
          height: 42,
          fontFamily: "inherit",
          fontSize: 14,
          border: "1px solid #e0e0e0",
          borderRadius: 9,
          padding: "0 12px",
          outline: "none",
          background: "#fff",
          marginBottom: 12,
        }}
      >
        {DIAGNOSIS_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s] || s}
          </option>
        ))}
      </select>

      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6e6e73", marginBottom: 6 }}>
        관리자 메모
      </label>
      <textarea
        value={memo}
        onChange={(e) => {
          setSaved(false);
          setMemo(e.target.value);
        }}
        placeholder="내부 메모"
        style={{
          width: "100%",
          minHeight: 70,
          fontFamily: "inherit",
          fontSize: 14,
          border: "1px solid #e0e0e0",
          borderRadius: 9,
          padding: "10px 12px",
          outline: "none",
          resize: "vertical",
          background: "#fff",
          marginBottom: 12,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          style={{
            height: 40,
            padding: "0 18px",
            borderRadius: 9,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            border: "none",
            background: "#0071e3",
            color: "#fff",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        {saved && <span style={{ fontSize: 13, fontWeight: 600, color: "#1e7a50" }}>✓ 저장됨</span>}
      </div>
    </div>
  );
}
