// web/app/(admin)/admin/leads/[id]/ConsultingTrack.tsx
// 컨설팅 진행 트랙 — 7단계 파이프라인 + 단계별 체크리스트 + 메모. admin.html renderConsult 포팅.
"use client";

import { useState, useTransition } from "react";
import { CONSULTING_STAGES, checklistForStage } from "@/lib/constants/consulting";
import { updateConsulting } from "./actions";

export default function ConsultingTrack({
  id,
  initialStage,
  initialChecklist,
  initialNotes,
}: {
  id: string;
  initialStage: string;
  initialChecklist: Record<string, boolean>;
  initialNotes: string;
}) {
  const [stage, setStage] = useState(initialStage || CONSULTING_STAGES[0].key);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(initialChecklist);
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const stageDone = (stageKey: string) => {
    const items = checklistForStage(stageKey);
    return items.length > 0 && items.every((it) => checklist[it.key]);
  };
  const checkedCount = (stageKey: string) =>
    checklistForStage(stageKey).filter((it) => checklist[it.key]).length;

  const current = CONSULTING_STAGES.find((s) => s.key === stage) ?? CONSULTING_STAGES[0];
  const items = checklistForStage(current.key);

  const toggle = (key: string) => {
    setSaved(false);
    setChecklist((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      await updateConsulting(id, { stage, checklist, notes });
      setSaved(true);
    });
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
        {CONSULTING_STAGES.map((s) => {
          const cur = s.key === stage;
          const done = stageDone(s.key);
          const total = checklistForStage(s.key).length;
          return (
            <button
              type="button"
              key={s.key}
              onClick={() => {
                setSaved(false);
                setStage(s.key);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                minWidth: 78,
                flex: "1 1 78px",
                padding: "9px 6px",
                border: `1px solid ${cur ? "#0066cc" : done ? "#2e9e6b" : "#e0e0e0"}`,
                borderRadius: 10,
                background: cur ? "rgba(0,102,204,0.1)" : "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: cur ? "#0066cc" : "#1d1d1f",
                  textAlign: "center",
                  lineHeight: 1.25,
                }}
              >
                {s.title}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: done ? "#2e9e6b" : "#6e6e73",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {done ? "✓" : `${checkedCount(s.key)}/${total}`}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: "#0066cc", margin: "0 0 10px" }}>
        {current.title} 체크리스트
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 16 }}>
        {items.map((it) => {
          const on = !!checklist[it.key];
          return (
            <label
              key={it.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(it.key)}
                style={{ width: 17, height: 17, accentColor: "#0066cc", cursor: "pointer", flex: "0 0 auto" }}
              />
              <span
                style={{
                  color: on ? "#6e6e73" : "#1d1d1f",
                  textDecoration: on ? "line-through" : "none",
                }}
              >
                {it.label}
              </span>
            </label>
          );
        })}
      </div>

      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6e6e73", margin: "6px 0" }}>
        컨설팅 메모
      </label>
      <textarea
        value={notes}
        onChange={(e) => {
          setSaved(false);
          setNotes(e.target.value);
        }}
        placeholder="상담 내용·다음 액션 기록"
        style={{
          width: "100%",
          minHeight: 64,
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
          {pending ? "저장 중…" : "진행 저장"}
        </button>
        {saved && <span style={{ fontSize: 13, fontWeight: 600, color: "#1e7a50" }}>✓ 저장됨</span>}
      </div>
    </div>
  );
}
