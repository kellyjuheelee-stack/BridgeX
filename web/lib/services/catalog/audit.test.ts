// web/lib/services/catalog/audit.test.ts
// backend/tests/catalog-audit.test.mjs 의 vitest 포팅. 동작 동일성이 정확성(법적 안전) 게이트.
import { describe, it, expect } from "vitest";
import * as catalog from "./audit";
import { auditText, DISCLAIMER, CLAIM_RULES, BUYER_READY_CHECKS } from "./audit";

describe("catalog audit", () => {
  it("위험 표현 감지: 미백 + 치료", () => {
    const r = auditText("이 제품은 미백에 좋고 여드름 치료에 효과적입니다.");
    const keys = r.findings.map((f) => f.key);
    expect(keys.includes("whitening")).toBe(true);
    expect(keys.includes("medicinal")).toBe(true);
    expect(r.summary.flaggedCount).toBe(r.findings.length);
  });

  it("영문 whitening/anti-inflammatory 감지", () => {
    const r = auditText("Our whitening cream is anti-inflammatory.");
    const keys = r.findings.map((f) => f.key);
    expect(keys.includes("whitening")).toBe(true);
    expect(keys.includes("medicinal")).toBe(true);
  });

  it("발견마다 category·why·hint·matched 포함", () => {
    const r = auditText("미백 화이트닝");
    const f = r.findings.find((x) => x.key === "whitening")!;
    expect(!!(f.category && f.why && f.hint)).toBe(true);
    expect(Array.isArray(f.matched) && f.matched.length >= 1).toBe(true);
  });

  it("바이어레디: INCI·인증·거래조건·영문", () => {
    const r = auditText("Full INCI list. ISO 22716 certified. MOQ 500, FOB Busan.");
    const map = Object.fromEntries(r.buyerReady.map((b) => [b.item, b.present]));
    expect(map["INCI 전성분"]).toBe(true);
    expect(map["인증"]).toBe(true);
    expect(map["거래조건(MOQ·Incoterms)"]).toBe(true);
    expect(map["영문 자료"]).toBe(true);
  });

  it("깨끗한 문구는 flaggedCount 0", () => {
    const r = auditText("가볍게 발리는 데일리 모이스처라이저입니다.");
    expect(r.summary.flaggedCount).toBe(0);
  });

  it("빈 입력 안전", () => {
    const r = auditText("");
    expect(r.summary.flaggedCount).toBe(0);
    expect(r.summary.checkedChars).toBe(0);
  });

  it("20000자 상한", () => {
    const r = auditText("가".repeat(25000));
    expect(r.summary.checkedChars).toBe(20000);
  });

  it("면책 문구 항상 포함 + 단정 표현 없음", () => {
    const r = auditText("미백");
    expect(r.disclaimer).toBe(DISCLAIMER);
    expect(/법률 자문/.test(r.disclaimer)).toBe(true);
    // 규칙 텍스트에 단정 표현(금지/위반/불법)이 없어야 함 — 법적 안전 불변식
    const blob = JSON.stringify({ ...catalog, CLAIM_RULES, BUYER_READY_CHECKS, DISCLAIMER, auditText });
    expect(/금지|위반|불법/.test(blob)).toBe(false);
  });
});
