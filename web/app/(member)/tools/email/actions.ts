// web/app/(member)/tools/email/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMemberContext } from "../memberContext";
import { generate, type EmailContext, type GeneratedDraft } from "@/lib/services/email/templates";

export type EmailDraftResult = { ok: true; draft: GeneratedDraft } | { ok: false; error: string };

// 상황·바이어 입력으로 영문 초안 생성. 회원 컨텍스트는 서버에서 진단행으로 채운다.
export async function generateEmailDraft(
  situation: string,
  inputs: Record<string, string>
): Promise<EmailDraftResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!situation) return { ok: false, error: "상황을 선택해주세요." };

  const { ctx } = await loadMemberContext(user.id);
  const merged: EmailContext = { ...ctx, ...(inputs || {}) };
  const draft = generate(situation, merged);
  if (!draft) return { ok: false, error: "유효하지 않은 상황입니다." };
  return { ok: true, draft };
}
