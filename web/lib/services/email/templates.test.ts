// web/lib/services/email/templates.test.ts
// 레거시 이메일 템플릿엔 테스트가 없어 새로 추가한 스모크 테스트:
// (1) 템플릿 목록/메타, (2) 회원 컨텍스트 변수 치환.
import { describe, it, expect } from "vitest";
import { TEMPLATES, templatesMeta, generate, type EmailContext } from "./templates";

const memberCtx: EmailContext = {
  contactName: "Jane Kim",
  brand: "GlowLab",
  product: "Barrier Serum",
  category: "스킨케어",
  countries: ["프랑스"],
  certs: ["ISO 22716", "비건 인증"],
  sales: "월 5,000개",
  sellingInKorea: true,
};

describe("email templates — 목록/메타", () => {
  it("6개 상황 템플릿을 제공", () => {
    expect(TEMPLATES.length).toBe(6);
    const keys = TEMPLATES.map((t) => t.key);
    expect(keys).toEqual(["cold", "tradeshow", "reminder", "interest", "sample", "meeting"]);
  });

  it("templatesMeta 는 build 를 제외하고 fields 를 포함", () => {
    const meta = templatesMeta();
    expect(meta.length).toBe(6);
    for (const m of meta) {
      expect(m).not.toHaveProperty("build");
      expect(Array.isArray(m.fields)).toBe(true);
    }
    const cold = meta.find((m) => m.key === "cold");
    expect(cold?.fields.some((f) => f.key === "buyerCompany" && f.required)).toBe(true);
  });
});

describe("email templates — 변수 치환", () => {
  it("회원 컨텍스트(브랜드·제품·인증·판매)가 본문에 반영", () => {
    const d = generate("cold", { ...memberCtx, buyerCompany: "Maison Beauté", buyerName: "Marie Dubois" });
    expect(d).not.toBeNull();
    expect(d!.subject).toContain("GlowLab");
    expect(d!.body).toContain("Dear Marie Dubois,");
    expect(d!.body).toContain("Barrier Serum");
    expect(d!.body).toContain("ISO 22716, 비건 인증 certified.");
    expect(d!.body).toContain("월 5,000개");
    expect(d!.body).toContain("at Maison Beauté");
  });

  it("담당자 이름 없으면 회사명 team 인사, 없으면 Hello,", () => {
    const withCompany = generate("cold", { ...memberCtx, buyerCompany: "Maison Beauté" });
    expect(withCompany!.body.startsWith("Dear Maison Beauté team,")).toBe(true);
    const bare = generate("reminder", { ...memberCtx });
    expect(bare!.body.startsWith("Hello,")).toBe(true);
  });

  it("'없음/잘 모르겠음' 인증은 certLine 에서 제외", () => {
    const d = generate("cold", { ...memberCtx, certs: ["없음", "잘 모르겠음"], buyerCompany: "X" });
    expect(d!.body).not.toContain("certified.");
  });

  it("빈 컨텍스트도 안전한 기본 문구", () => {
    const d = generate("cold", {});
    expect(d!.body).toContain("our brand");
    expect(d!.body).toContain("our K-beauty products");
    expect(d!.body).toContain("[your name]");
  });

  it("알 수 없는 상황은 null", () => {
    expect(generate("nope", memberCtx)).toBeNull();
  });
});
