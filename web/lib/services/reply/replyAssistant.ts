// web/lib/services/reply/replyAssistant.ts
// 바이어 답장 대응 도구 (STEP 4)
// 레거시 backend/src/constants/replyAssistant.js 의 TS 포팅 — 동작 동일성 유지.
//
// 회원이 받은 바이어 답장(영/국문)을 붙여넣으면 의도를 규칙 기반으로 분석하고,
// 회원 컨텍스트(브랜드·제품·인증)를 반영한 영문 대응 초안을 만든다.
// 순수 함수 — Supabase import 금지.

export interface IntentRule {
  key: string;
  label: string;
  negotiation?: boolean;
  signals: string[];
}

export interface Intent {
  key: string;
  label: string;
}

export interface ReplyAnalysis {
  intents: Intent[];
  needsExpert: boolean;
  isRejection: boolean;
}

export interface ReplyContext {
  brand?: string;
  product?: string;
  contactName?: string;
  buyerName?: string;
  certs?: string[];
}

export interface ReplyDraft {
  subject: string;
  body: string;
}

export const INTENT_RULES: IntentRule[] = [
  {
    key: "interested",
    label: "관심 표현",
    signals: ["interested", "keen", "love to", "would like to know", "sounds great", "impressed", "excited", "관심", "좋아", "좋습니다"],
  },
  {
    key: "pricing",
    label: "가격·MOQ·거래조건",
    negotiation: true,
    signals: ["price", "pricing", "cost", "quote", "quotation", "moq", "minimum order", "wholesale", "margin", "fob", "cif", "exw", "incoterm", "가격", "단가", "견적", "도매"],
  },
  { key: "samples", label: "샘플 요청", signals: ["sample", "samples", "tester", "testers", "샘플", "테스터"] },
  {
    key: "materials",
    label: "카탈로그·자료 요청",
    signals: ["catalog", "catalogue", "brochure", "line sheet", "product list", "price list", "deck", "presentation", "카탈로그", "자료", "브로슈어"],
  },
  {
    key: "compliance",
    label: "인증·성분·규제 문서",
    signals: ["cpnp", "inci", "ingredient", "ingredients", "certificate", "certification", "certified", "gmp", "iso", "msds", "sds", "documentation", "compliance", "regulatory", "성분", "인증", "서류", "규제"],
  },
  {
    key: "meeting",
    label: "미팅·통화 요청",
    negotiation: true,
    signals: ["call", "meeting", "video call", "zoom", "teams", "google meet", "schedule a", "let's talk", "hop on", "미팅", "통화", "미팅 잡", "회의"],
  },
  {
    key: "timeline",
    label: "납기·배송",
    signals: ["lead time", "delivery", "shipping", "when can you", "how soon", "stock", "availability", "in stock", "납기", "배송", "재고"],
  },
  {
    key: "notnow",
    label: "거절·보류",
    signals: ["not interested", "no thank", "unfortunately", "not a good fit", "not a fit", "we will pass", "maybe later", "next time", "at this time", "관심이 없", "관심 없", "다음 기회", "어렵습니다", "보류"],
  },
];

export function analyzeReply(text: unknown): ReplyAnalysis {
  const lower = (text == null ? "" : String(text)).toLowerCase();
  const intents: Intent[] = [];
  let negotiation = false;
  for (const r of INTENT_RULES) {
    if (r.signals.some((s) => lower.includes(s.toLowerCase()))) {
      intents.push({ key: r.key, label: r.label });
      if (r.negotiation) negotiation = true;
    }
  }
  const isRejection = intents.some((i) => i.key === "notnow");
  // 가격·미팅(협상 단계)이면서 거절이 아니면 → 전문가 준비 권장
  return { intents, needsExpert: negotiation && !isRejection, isRejection };
}

export function draftResponse(analysis: ReplyAnalysis, ctx?: ReplyContext): ReplyDraft {
  ctx = ctx || {};
  const keys = analysis.intents.map((i) => i.key);
  const has = (k: string) => keys.indexOf(k) !== -1;
  const brand = (ctx.brand || "").trim() || "our brand";
  const product = (ctx.product || "").trim() || "our products";
  const name = (ctx.contactName || "").trim();
  const buyer = (ctx.buyerName || "").trim();
  const greet = buyer ? `Dear ${buyer},` : "Hello,";
  const certs = (ctx.certs || []).filter((c) => ["없음", "잘 모르겠음"].indexOf(c) === -1);

  const lines: string[] = [];
  if (analysis.isRejection) {
    lines.push(`Thank you very much for taking the time to consider ${brand}.`);
    lines.push(
      `I completely understand. If the timing changes or your assortment needs evolve, I'd be glad to reconnect — I'll keep you posted on new launches and stay in touch.`
    );
  } else {
    lines.push(`Thank you so much for your reply and your interest in ${product}.`);
    const paras: string[] = [];
    if (has("pricing"))
      paras.push(`I'd be glad to share our price list, MOQ, and Incoterms — I'll prepare a tailored offer sheet for your market.`);
    if (has("samples"))
      paras.push(`We can arrange samples. Could you confirm the best shipping address and which items you'd like to try?`);
    if (has("materials")) paras.push(`I'm attaching (or can send) our full catalog and product line sheet.`);
    if (has("compliance"))
      paras.push(
        `On compliance: ${
          certs.length ? "our products are " + certs.slice(0, 3).join(", ") + " certified, and " : ""
        }we can walk you through the INCI list and EU documentation (CPNP) status.`
      );
    if (has("timeline"))
      paras.push(`Regarding lead time and delivery, I'll confirm current availability and shipping timelines for your order size.`);
    if (has("meeting"))
      paras.push(`A short call sounds great — would any time next week work for you? I can send a few options in your time zone.`);
    if (!paras.length)
      paras.push(`I'd love to share more details — our catalog, pricing, and how we can support your market entry.`);
    for (const p of paras) lines.push(p);
    lines.push(`Looking forward to your thoughts.`);
  }

  const sig = `Best regards,\n${name}\n${brand}`;
  const body = `${greet}\n\n${lines.join("\n\n")}\n\n${sig}`.replace(/\n{3,}/g, "\n\n");
  const subject = analysis.isRejection ? `Thank you — ${brand}` : `Re: ${brand} — next steps`;
  return { subject, body };
}

// 대응 팁 (한글, 회원 참고용)
export function tipsFor(analysis: ReplyAnalysis): string[] {
  const tips: string[] = [];
  const keys = analysis.intents.map((i) => i.key);
  if (keys.indexOf("pricing") !== -1) tips.push("가격은 즉답보다 시장·수량에 맞춘 Offer Sheet로 보내면 협상 여지가 생깁니다.");
  if (keys.indexOf("samples") !== -1) tips.push("샘플 발송 시 배송비 부담 주체와 예상 수량을 함께 정하세요.");
  if (keys.indexOf("compliance") !== -1) tips.push("규제 서류(CPNP·INCI)는 정확성이 중요합니다 — 확답 전 전문가 확인을 권장합니다.");
  if (keys.indexOf("meeting") !== -1) tips.push("미팅 전 제품·가격·인증 요약 한 장을 준비하면 신뢰가 올라갑니다.");
  if (analysis.isRejection) tips.push("거절도 관계 유지 기회입니다. 정중히 문을 열어두고 후속 시점을 남기세요.");
  return tips;
}
