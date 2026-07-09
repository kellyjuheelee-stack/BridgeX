// web/app/(member)/mypage/RoadmapToggle.tsx
"use client";

import { useTransition } from "react";
import { toggleRoadmapStep } from "./actions";
import styles from "./mypage.module.css";

export default function RoadmapToggle({
  stepId,
  done,
}: {
  stepId: string;
  done: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={`${styles.rmCheck} ${done ? styles.on : ""}`}
      aria-pressed={done}
      aria-label={done ? "완료 해제" : "완료 표시"}
      disabled={pending}
      onClick={() => startTransition(() => toggleRoadmapStep(stepId))}
    >
      {done ? "✓" : ""}
    </button>
  );
}
