// web/lib/services/diagnosis/generateDiagnosis.test.ts
import { describe, it, expect } from "vitest";
import { generateDiagnosis } from "./generateDiagnosis";
import type { ChecklistAnswers } from "./types";
import { CHECKLIST_GROUPS } from "@/lib/constants/diagnosisChecklist";

// 모든 항목 false 로 시작하는 헬퍼
function base(overrides: Partial<ChecklistAnswers> = {}): ChecklistAnswers {
  const a: Record<string, boolean> = {};
  for (const g of CHECKLIST_GROUPS) for (const it of g.items) a[it.key] = false;
  return { ...(a as ChecklistAnswers), companyName: "테스트브랜드", ...overrides };
}

describe("generateDiagnosis", () => {
  it("전부 미체크 → 낮은 점수 + 전 영역 갭 + EU 7개 전부 missing", () => {
    const r = generateDiagnosis(base());
    expect(r.readinessLevel).toBe("준비 필요");
    expect(r.euStatus.haveCount).toBe(0);
    expect(r.euStatus.missing).toHaveLength(7);
    expect(r.sections.productReadiness.gaps).toContain("국내 판매 실적/레퍼런스");
    expect(r.sections.productReadiness.gaps).toContain("인증 확보(GMP·ISO 22716 등)");
    // 제품 경쟁력 = clamp(45) = 45
    expect(r.sections.productReadiness.score).toBe(45);
    // EU = clamp(20*0.8 + 20*0.2) = clamp(20) = 20
    expect(r.sections.euRegulationReadiness.score).toBe(20);
  });

  it("EU 필수 7요건 전부 체크 → euStatus.missing 비고 haveCount 7", () => {
    const r = generateDiagnosis(
      base({ euRp: true, euCpnp: true, euPif: true, euCpsr: true, euInci: true, euLabeling: true, euAllergen: true })
    );
    expect(r.euStatus.haveCount).toBe(7);
    expect(r.euStatus.missing).toHaveLength(0);
    // euBase = 20 + (7/7)*70 = 90, pkg 0 → 20 ; EU = clamp(90*0.8 + 20*0.2) = clamp(76) = 76
    expect(r.sections.euRegulationReadiness.score).toBe(76);
  });

  it("제품 경쟁력 전부 체크 → clamp(45+25+18+10)=98", () => {
    const r = generateDiagnosis(base({ sellingInKorea: true, hasManufacturingCert: true, hasSalesRecord: true }));
    expect(r.sections.productReadiness.score).toBe(98);
    expect(r.sections.productReadiness.gaps).toHaveLength(0);
  });

  it("접점 바이어 없음 → 우선과제에 '타겟 바이어 발굴' 포함", () => {
    const r = generateDiagnosis(base());
    expect(r.priorities.some((p) => p.label === "타겟 바이어 발굴")).toBe(true);
  });

  it("접점 바이어 있음 → 우선과제에 'Follow-up·협상 전략' 계열 포함", () => {
    const r = generateDiagnosis(base({ hasBuyer: true }));
    expect(r.priorities.some((p) => p.label.includes("Follow-up"))).toBe(true);
  });

  it("전부 체크 → 종합점수 상승 + Offer Sheet/영문자료 갭 없음", () => {
    const all = base();
    for (const k of Object.keys(all)) if (typeof (all as any)[k] === "boolean") (all as any)[k] = true;
    const r = generateDiagnosis(all);
    expect(r.overallScore).toBeGreaterThanOrEqual(75);
    expect(r.readinessLevel).toBe("준비됨");
    expect(r.sections.salesMaterialReadiness.gaps).toHaveLength(0);
  });
});
