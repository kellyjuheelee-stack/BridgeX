// web/lib/services/roadmap/buildRoadmap.test.ts
// backend/tests/roadmap.test.mjs 의 vitest 포팅. 동작 동일성이 정확성 게이트.
import { describe, it, expect } from "vitest";
import { buildRoadmap, isValidStepId } from "./buildRoadmap";
import type { RoadmapDiagnosis } from "./types";

// 브로셔 없음 + EU 준비 일부 보유 회원
const diagBrochureless: RoadmapDiagnosis = {
  isSellingInKorea: "판매 중",
  certifications: ["ISO 22716", "비건 인증"],
  euComplianceReadiness: ["CPNP 사전 등록", "제품정보파일(PIF) 구비"],
  packagingReadiness: [],
  productFiles: [],
};

describe("buildRoadmap", () => {
  it("16단계 반환, 택일 단계는 하나만", () => {
    const { steps, progress } = buildRoadmap(diagBrochureless, {});
    expect(steps.length).toBe(16);
    expect(progress.total).toBe(16);
    const ids = steps.map((s) => s.id);
    // 브로셔 없음 → catalog_generate 노출, catalog_audit 미노출
    expect(ids.includes("catalog_generate")).toBe(true);
    expect(ids.includes("catalog_audit")).toBe(false);
  });

  it("진단 데이터로 done 파생", () => {
    const { steps } = buildRoadmap(diagBrochureless, {});
    const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
    expect(byId.eu_cpnp.done).toBe(true); // euComplianceReadiness에 포함
    expect(byId.eu_pif.done).toBe(true);
    expect(byId.eu_rp.done).toBe(false); // 미포함
    expect(byId.domestic_proof.done).toBe(true); // 판매중 + 실인증
  });

  it("브로셔 있으면 catalog_audit 택일", () => {
    const { steps } = buildRoadmap(
      { ...diagBrochureless, productFiles: [{ fileName: "a.pdf" }] },
      {}
    );
    const ids = steps.map((s) => s.id);
    expect(ids.includes("catalog_audit")).toBe(true);
    expect(ids.includes("catalog_generate")).toBe(false);
  });

  it("회원 진행상태가 파생값을 override", () => {
    const { steps, progress } = buildRoadmap(diagBrochureless, {
      eu_rp: { done: true, doneAt: "2026-07-09T00:00:00.000Z" },
    });
    const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
    expect(byId.eu_rp.done).toBe(true);
    expect(byId.eu_rp.derivedDone).toBe(false); // 파생은 여전히 false
    expect(progress.doneCount).toBeGreaterThanOrEqual(4);
  });

  it("expertRemaining은 미완료 expert/hybrid 수", () => {
    const { steps, progress } = buildRoadmap(diagBrochureless, {});
    const manual = steps.filter(
      (s) => (s.tag === "expert" || s.tag === "hybrid") && !s.done
    ).length;
    expect(progress.expertRemaining).toBe(manual);
    expect(progress.expertRemaining).toBeGreaterThan(0);
  });

  it("빈 진단도 안전하게 16단계", () => {
    const { steps } = buildRoadmap(null, {});
    expect(steps.length).toBe(16);
  });

  it("isValidStepId", () => {
    expect(isValidStepId("eu_cpnp")).toBe(true);
    expect(isValidStepId("nope")).toBe(false);
  });
});
