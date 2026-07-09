// web/app/(member)/tools/catalog/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { auditText, type AuditResult } from "@/lib/services/catalog/audit";

// 카탈로그 문구 컴플라이언스 예비 점검 (compute-only, 미저장 — 레거시 v1과 동일).
export async function runCatalogAudit(text: string): Promise<AuditResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return auditText(text);
}
