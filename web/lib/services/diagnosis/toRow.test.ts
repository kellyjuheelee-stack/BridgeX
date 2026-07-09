// web/lib/services/diagnosis/toRow.test.ts
import { describe, it, expect } from "vitest";
import { toRow, type DiagnoseInput } from "./toRow";
import { generateDiagnosis } from "./generateDiagnosis";
import type { ChecklistAnswers } from "./types";
import { CHECKLIST_GROUPS } from "@/lib/constants/diagnosisChecklist";

function answers(overrides: Partial<ChecklistAnswers> = {}): ChecklistAnswers {
  const a: Record<string, boolean> = {};
  for (const g of CHECKLIST_GROUPS) for (const it of g.items) a[it.key] = false;
  return { ...(a as ChecklistAnswers), companyName: "다은코스메틱", ...overrides };
}
function input(a: ChecklistAnswers): DiagnoseInput {
  return {
    contact: { contactName: "김담당", companyName: "다은코스메틱", email: "d@c.co", phone: "010", homepageUrl: null, smartStoreUrl: null, instagramUrl: null },
    product: { productName: "수분크림", productCategory: "스킨케어", targetCountries: ["독일"] },
    answers: a,
    consentedAt: "2026-07-09T00:00:00.000Z",
    memberId: null,
  };
}

describe("toRow", () => {
  it("raw 응답을 checklist_answers 에 저장한다", () => {
    const a = answers({ euRp: true });
    const row = toRow(input(a), generateDiagnosis(a));
    expect((row.checklist_answers as ChecklistAnswers).euRp).toBe(true);
  });

  it("EU 체크를 eu_compliance_readiness 배열로 파생 채움한다", () => {
    const a = answers({ euRp: true, euCpnp: true });
    const row = toRow(input(a), generateDiagnosis(a));
    expect(row.eu_compliance_readiness).toEqual(
      expect.arrayContaining(["EU 책임자(Responsible Person) 지정", "CPNP 사전 등록"])
    );
  });

  it("바이어 체크를 has_existing_buyer 로 파생 채움한다", () => {
    const a = answers({ hasBuyer: true });
    const row = toRow(input(a), generateDiagnosis(a));
    expect(row.has_existing_buyer).toBe("있음");
  });

  it("diagnosis_result 와 consultation 기본값을 채운다", () => {
    const a = answers();
    const row = toRow(input(a), generateDiagnosis(a));
    expect((row.diagnosis_result as any).overallScore).toBeGreaterThan(0);
    expect(row.diagnosis_status).toBe("submitted");
    expect(row.member_id).toBeNull();
  });
});
