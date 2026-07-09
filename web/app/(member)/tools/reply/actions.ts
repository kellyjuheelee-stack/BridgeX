// web/app/(member)/tools/reply/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMemberContext } from "../memberContext";
import { analyzeReply, draftResponse, tipsFor, type Intent, type ReplyDraft } from "@/lib/services/reply/replyAssistant";

export interface ReplyAssistResult {
  intents: Intent[];
  needsExpert: boolean;
  isRejection: boolean;
  draft: ReplyDraft;
  tips: string[];
  diagnosisId: string | null;
}

// 바이어 답장 분석 + 대응 초안. 회원 컨텍스트는 서버에서 진단행으로 채운다.
export async function runReplyAssist(text: string, buyerName: string): Promise<ReplyAssistResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const analysis = analyzeReply(text);
  const { ctx, diagnosisId } = await loadMemberContext(user.id);
  const draft = draftResponse(analysis, { ...ctx, buyerName: (buyerName || "").trim() });
  const tips = tipsFor(analysis);

  return {
    intents: analysis.intents,
    needsExpert: analysis.needsExpert,
    isRejection: analysis.isRejection,
    draft,
    tips,
    diagnosisId,
  };
}
