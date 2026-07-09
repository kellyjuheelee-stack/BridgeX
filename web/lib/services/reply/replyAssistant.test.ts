// web/lib/services/reply/replyAssistant.test.ts
// backend/tests/reply-assistant.test.mjs 의 vitest 포팅. 동작 동일성이 정확성 게이트.
import { describe, it, expect } from "vitest";
import { analyzeReply, draftResponse, tipsFor, type ReplyContext } from "./replyAssistant";

const ctx: ReplyContext = {
  contactName: "Jane",
  brand: "GlowLab",
  product: "Barrier Serum",
  buyerName: "Marie",
  certs: ["ISO 22716", "비건 인증"],
};

describe("reply assistant", () => {
  it("가격·샘플 의도 감지", () => {
    const a = analyzeReply("Hi, we are interested. Could you share your price list, MOQ and send some samples?");
    const keys = a.intents.map((i) => i.key);
    expect(keys.includes("pricing")).toBe(true);
    expect(keys.includes("samples")).toBe(true);
    expect(keys.includes("interested")).toBe(true);
    expect(a.needsExpert).toBe(true); // pricing = 협상 단계
  });

  it("draft가 감지된 의도를 반영", () => {
    const a = analyzeReply("Please send price and samples.");
    const d = draftResponse(a, ctx);
    expect(/Dear Marie,/.test(d.body)).toBe(true);
    expect(/price list/.test(d.body)).toBe(true);
    expect(/samples/i.test(d.body)).toBe(true);
    expect(/GlowLab/.test(d.body)).toBe(true);
    expect(/Re: GlowLab/.test(d.subject)).toBe(true);
  });

  it("compliance 의도 → 인증 언급 + 전문가 팁", () => {
    const a = analyzeReply("Can you provide INCI and CPNP documentation?");
    const d = draftResponse(a, ctx);
    expect(/ISO 22716/.test(d.body)).toBe(true);
    expect(/CPNP/.test(d.body)).toBe(true);
    const tips = tipsFor(a);
    expect(tips.some((t) => /전문가 확인/.test(t))).toBe(true);
  });

  it("거절 답장 → 관계 유지 톤, needsExpert 아님", () => {
    const a = analyzeReply("Thank you but unfortunately this is not a fit for us at this time.");
    expect(a.isRejection).toBe(true);
    expect(a.needsExpert).toBe(false);
    const d = draftResponse(a, ctx);
    expect(/completely understand/.test(d.body)).toBe(true);
    expect(/Thank you — GlowLab/.test(d.subject)).toBe(true);
  });

  it("의도 없는 텍스트도 안전하게 기본 draft", () => {
    const a = analyzeReply("Hello.");
    expect(a.intents.length).toBe(0);
    const d = draftResponse(a, ctx);
    expect(d.body.length > 0 && d.subject.length > 0).toBe(true);
  });

  it("buyerName 없으면 Hello, 로 시작", () => {
    const a = analyzeReply("interested");
    const d = draftResponse(a, { brand: "GlowLab", contactName: "Jane" });
    expect(/^Hello,/.test(d.body)).toBe(true);
  });
});
