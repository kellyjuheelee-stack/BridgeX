// web/lib/constants/consulting.test.ts
// backend/src/constants/enums.js 의 CONSULTING_STAGES 와 동작 동일성 검증.
// 단계 수(7) + 전체 체크리스트 항목 수(24)가 레거시와 일치해야 한다.
import { describe, it, expect } from "vitest";
import {
  CONSULTING_STAGES,
  CONSULTING_CHECKLIST,
  checklistForStage,
} from "./consulting";

describe("consulting constants (legacy enums.js parity)", () => {
  it("단계 수 = 7", () => {
    expect(CONSULTING_STAGES.length).toBe(7);
  });

  it("전체 체크리스트 항목 수 = 24 (레거시 enums.js 합계)", () => {
    const total = CONSULTING_CHECKLIST.reduce((n, g) => n + g.items.length, 0);
    expect(total).toBe(24);
  });

  it("모든 체크리스트 그룹의 stageKey 가 단계 key 와 매핑된다", () => {
    const stageKeys = new Set(CONSULTING_STAGES.map((s) => s.key));
    for (const g of CONSULTING_CHECKLIST) {
      expect(stageKeys.has(g.stageKey)).toBe(true);
    }
    // 모든 단계가 정확히 하나의 체크리스트 그룹을 가진다
    expect(CONSULTING_CHECKLIST.length).toBe(CONSULTING_STAGES.length);
  });

  it("체크리스트 항목 key 는 전역에서 유일하다", () => {
    const keys = CONSULTING_CHECKLIST.flatMap((g) => g.items.map((i) => i.key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("checklistForStage 는 해당 단계 항목을 반환하고 미지정 시 빈 배열", () => {
    expect(checklistForStage("regDocs").map((i) => i.key)).toEqual([
      "rd_rp",
      "rd_cpnp",
      "rd_pif",
      "rd_inci",
      "rd_label",
    ]);
    expect(checklistForStage(null)).toEqual([]);
    expect(checklistForStage("nope")).toEqual([]);
  });
});
