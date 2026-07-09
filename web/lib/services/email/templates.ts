// web/lib/services/email/templates.ts
// 상황별 콜드/후속 이메일 템플릿 (STEP 3·4 AI 자동화)
// 레거시 backend/src/constants/emailTemplates.js 의 TS 포팅 — 동작 동일성 유지.
//
// 각 템플릿은 회원 컨텍스트(브랜드·제품·인증·목표국가 = 진단 데이터 자동 반영)와
// 회원 입력(바이어 정보 + 상황별 필드)을 받아 영문 초안 {subject, body} 을 만든다.
// 순수 함수 — Supabase import 금지.

export interface EmailContext {
  contactName?: string;
  brand?: string;
  product?: string;
  category?: string;
  countries?: string[];
  certs?: string[];
  price?: string;
  sales?: string;
  sellingInKorea?: boolean;
  // 회원 입력(바이어 정보 + 상황별 필드)
  buyerName?: string;
  buyerCompany?: string;
  showName?: string;
  question?: string;
  times?: string;
  [key: string]: unknown;
}

export interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
}

export interface EmailTemplateMeta {
  key: string;
  label: string;
  desc: string;
  fields: TemplateField[];
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface GeneratedDraft extends EmailDraft {
  situation: string;
  label: string;
}

interface EmailTemplate extends EmailTemplateMeta {
  build(ctx: EmailContext): EmailDraft;
}

function cap(s?: unknown): string {
  return (s == null ? "" : String(s)).trim();
}
function firstName(name?: unknown): string {
  const n = cap(name);
  return n ? n.split(/\s+/)[0] : "";
}
function greeting(ctx: EmailContext): string {
  const fn = firstName(ctx.buyerName);
  return fn ? `Dear ${ctx.buyerName},` : ctx.buyerCompany ? `Dear ${ctx.buyerCompany} team,` : "Hello,";
}
function certLine(ctx: EmailContext): string {
  const real = (ctx.certs || []).filter((c) => !["없음", "잘 모르겠음"].includes(c));
  return real.length ? `It is ${real.slice(0, 3).join(", ")} certified.` : "";
}
function salesLine(ctx: EmailContext): string {
  return ctx.sales
    ? `In Korea it sells well (${ctx.sales}).`
    : ctx.sellingInKorea
    ? "It has a proven track record in the Korean market."
    : "";
}
function product(ctx: EmailContext): string {
  return cap(ctx.product) || "our K-beauty products";
}
function brand(ctx: EmailContext): string {
  return cap(ctx.brand) || "our brand";
}
function country(ctx: EmailContext): string {
  const c = (ctx.countries || [])[0];
  return c && c !== "아직 정하지 못함" ? c : "the European";
}
function signoff(ctx: EmailContext): string {
  return `\n\nBest regards,\n${cap(ctx.contactName) || ""}\n${brand(ctx)}`.replace(/\n{3,}/g, "\n\n");
}

export const TEMPLATES: EmailTemplate[] = [
  {
    key: "cold",
    label: "콜드 이메일 (첫 제안)",
    desc: "처음 연락하는 바이어에게 브랜드·제품을 제안",
    fields: [
      { key: "buyerCompany", label: "바이어 회사명", placeholder: "예: Maison Beauté", required: true },
      { key: "buyerName", label: "담당자 이름 (선택)", placeholder: "예: Marie Dubois", required: false },
    ],
    build(ctx) {
      const subject = `Partnership inquiry — ${brand(ctx)} K-beauty ${cap(ctx.category) || "cosmetics"}`;
      const body = `${greeting(ctx)}

My name is ${cap(ctx.contactName) || "[your name]"}, and I represent ${brand(ctx)}, a Korean beauty brand. I'm reaching out because we're looking for the right partner to introduce our products to ${country(ctx)} market.

Our hero product is ${product(ctx)}${ctx.category ? ` (${ctx.category})` : ""}. ${certLine(ctx)} ${salesLine(ctx)}

We believe it would be a strong fit for your customers${ctx.buyerCompany ? ` at ${ctx.buyerCompany}` : ""}. We can share our full catalog, ingredient list (INCI), pricing, and MOQ on request.

Would you be open to a short conversation to explore a potential partnership?${signoff(ctx)}`;
      return { subject, body };
    },
  },
  {
    key: "tradeshow",
    label: "박람회 후속",
    desc: "박람회에서 명함 교환한 바이어에게 후속 연락",
    fields: [
      { key: "buyerCompany", label: "바이어 회사명", placeholder: "예: Maison Beauté", required: true },
      { key: "buyerName", label: "담당자 이름 (선택)", placeholder: "", required: false },
      { key: "showName", label: "박람회명", placeholder: "예: Cosmoprof Bologna", required: true },
    ],
    build(ctx) {
      const subject = `Great to meet you at ${cap(ctx.showName) || "the show"} — ${brand(ctx)}`;
      const body = `${greeting(ctx)}

It was a pleasure meeting you at ${cap(ctx.showName) || "the trade show"}. Thank you for taking the time to learn about ${brand(ctx)}.

As promised, I'd love to follow up on ${product(ctx)}. ${certLine(ctx)} ${salesLine(ctx)}

I'd be happy to send our catalog and pricing, or set up a quick call at your convenience. What would be the best next step for you?${signoff(ctx)}`;
      return { subject, body };
    },
  },
  {
    key: "reminder",
    label: "미응답 리마인더",
    desc: "답장이 없는 바이어에게 정중한 팔로업",
    fields: [
      { key: "buyerCompany", label: "바이어 회사명", placeholder: "", required: true },
      { key: "buyerName", label: "담당자 이름 (선택)", placeholder: "", required: false },
    ],
    build(ctx) {
      const subject = `Following up — ${brand(ctx)} ${product(ctx)}`;
      const body = `${greeting(ctx)}

I wanted to gently follow up on my previous email about ${brand(ctx)} and ${product(ctx)}.

I understand you're busy, so I'll keep this short: if there's any interest, I'd be glad to send samples or our catalog — no commitment. If the timing isn't right, just let me know and I'll follow up later.

Thank you for your time.${signoff(ctx)}`;
      return { subject, body };
    },
  },
  {
    key: "interest",
    label: "관심 답장 대응",
    desc: "바이어가 관심을 보였을 때 응답 (조건·다음 단계 안내)",
    fields: [
      { key: "buyerCompany", label: "바이어 회사명", placeholder: "", required: true },
      { key: "buyerName", label: "담당자 이름 (선택)", placeholder: "", required: false },
      { key: "question", label: "바이어가 물어본 내용 (선택)", placeholder: "예: MOQ와 가격, 유통 조건", required: false },
    ],
    build(ctx) {
      const subject = `Re: ${brand(ctx)} — details & next steps`;
      const body = `${greeting(ctx)}

Thank you so much for your interest in ${product(ctx)} — I'm glad to hear from you.

${ctx.question ? `To answer your question about ${cap(ctx.question)}:` : "Here are the key details:"}
- Product: ${product(ctx)}${ctx.category ? ` (${ctx.category})` : ""}
- ${certLine(ctx) || "Certifications available on request."}
- Pricing / MOQ / Incoterms: happy to share a tailored offer sheet
- EU compliance: we can walk you through CPNP / documentation status

Would a short video call this week work for you? I can prepare an offer sheet in advance.${signoff(ctx)}`;
      return { subject, body };
    },
  },
  {
    key: "sample",
    label: "샘플/카탈로그 안내",
    desc: "샘플·카탈로그 발송을 안내",
    fields: [
      { key: "buyerCompany", label: "바이어 회사명", placeholder: "", required: true },
      { key: "buyerName", label: "담당자 이름 (선택)", placeholder: "", required: false },
    ],
    build(ctx) {
      const subject = `Catalog & samples — ${brand(ctx)}`;
      const body = `${greeting(ctx)}

Thank you for your interest. I'm attaching (or can send) the following for ${product(ctx)}:
- Full product catalog (English)
- Ingredient list (INCI) and certifications
- Pricing, MOQ, and Incoterms

I'd be happy to arrange samples as well — could you confirm the best shipping address? Please let me know if you'd like a quick call to review anything.${signoff(ctx)}`;
      return { subject, body };
    },
  },
  {
    key: "meeting",
    label: "미팅 제안",
    desc: "온라인/오프라인 미팅을 제안",
    fields: [
      { key: "buyerCompany", label: "바이어 회사명", placeholder: "", required: true },
      { key: "buyerName", label: "담당자 이름 (선택)", placeholder: "", required: false },
      { key: "times", label: "제안 시간 (선택)", placeholder: "예: Tue/Wed 3–5pm CET", required: false },
    ],
    build(ctx) {
      const subject = `Quick call about ${brand(ctx)}?`;
      const body = `${greeting(ctx)}

I'd love to set up a short call to introduce ${brand(ctx)} and ${product(ctx)}, and see if there's a fit for ${ctx.buyerCompany || "your business"}.

${
        ctx.times
          ? `Would any of these work for you: ${cap(ctx.times)}?`
          : "Would you have 20 minutes this week or next? I can send a few time options in CET."
      }

I'll keep it focused: product, certifications, pricing, and how we can support your market entry.${signoff(ctx)}`;
      return { subject, body };
    },
  },
];

// 메타(프론트 렌더용): build 제외
export function templatesMeta(): EmailTemplateMeta[] {
  return TEMPLATES.map((t) => ({ key: t.key, label: t.label, desc: t.desc, fields: t.fields }));
}

export function generate(situation: string, ctx?: EmailContext): GeneratedDraft | null {
  const t = TEMPLATES.find((x) => x.key === situation);
  if (!t) return null;
  const draft = t.build(ctx || {});
  return { situation: t.key, label: t.label, ...draft };
}
