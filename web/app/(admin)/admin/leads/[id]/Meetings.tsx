// web/app/(admin)/admin/leads/[id]/Meetings.tsx
// 예정 미팅 관리 — 온/오프라인 미팅 목록 + 추가/삭제. admin.html renderMeetings 포팅.
"use client";

import { useState, useTransition } from "react";
import { addMeeting, deleteMeeting, type Meeting } from "./actions";

function fmtMeeting(iso: string | null): string {
  if (!iso) return "일시 미정";
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}.${p(dt.getMonth() + 1)}.${p(dt.getDate())} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

const input: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  fontSize: 14,
  fontFamily: "inherit",
  border: "1px solid #e0e0e0",
  borderRadius: 9,
  outline: "none",
  background: "#fff",
  width: "100%",
};

export default function Meetings({ id, meetings }: { id: string; meetings: Meeting[] }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("online");
  const [when, setWhen] = useState("");
  const [loc, setLoc] = useState("");
  const [pending, startTransition] = useTransition();

  const list = [...meetings].sort((a, b) =>
    (a.scheduledAt || "").localeCompare(b.scheduledAt || "")
  );

  const add = () => {
    startTransition(async () => {
      await addMeeting(id, {
        title,
        type,
        scheduledAt: when ? new Date(when).toISOString() : null,
        location: loc,
      });
      setTitle("");
      setType("online");
      setWhen("");
      setLoc("");
    });
  };

  return (
    <div>
      {list.length === 0 ? (
        <div style={{ color: "#b0b0b5", padding: "6px 0", fontSize: 14 }}>등록된 미팅이 없습니다.</div>
      ) : (
        list.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              padding: "12px 14px",
              background: "#f5f5f7",
              borderRadius: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: m.type === "offline" ? "rgba(120,80,220,0.14)" : "rgba(0,102,204,0.12)",
                  color: m.type === "offline" ? "#6b46c1" : "#0066cc",
                }}
              >
                {m.type === "offline" ? "오프라인" : "온라인"}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{m.title}</span>
            </div>
            <div style={{ fontSize: 13, color: "#6e6e73", flexBasis: "100%" }}>
              {fmtMeeting(m.scheduledAt)} ·{" "}
              {m.location ? (
                m.type === "online" ? (
                  <a href={m.location} target="_blank" rel="noreferrer" style={{ color: "#0066cc", fontWeight: 600 }}>
                    미팅 링크
                  </a>
                ) : (
                  m.location
                )
              ) : (
                <span style={{ color: "#b0b0b5" }}>장소/링크 미정</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => startTransition(() => deleteMeeting(id, m.id))}
              disabled={pending}
              style={{
                fontSize: 12,
                color: "#6e6e73",
                cursor: "pointer",
                fontWeight: 600,
                background: "none",
                border: "none",
                fontFamily: "inherit",
              }}
            >
              삭제
            </button>
          </div>
        ))
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 12,
          paddingTop: 14,
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="미팅 제목 (예: 1차 상담)"
          style={input}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...input, flex: "0 0 110px" }}>
            <option value="online">온라인</option>
            <option value="offline">오프라인</option>
          </select>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            style={{ ...input, flex: 1 }}
          />
        </div>
        <input
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
          placeholder="미팅 링크(온라인) 또는 장소(오프라인)"
          style={input}
        />
        <button
          type="button"
          onClick={add}
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
          {pending ? "처리 중…" : "미팅 추가"}
        </button>
      </div>
    </div>
  );
}
