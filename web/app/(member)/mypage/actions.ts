// web/app/(member)/mypage/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buildRoadmap, isValidStepId } from "@/lib/services/roadmap/buildRoadmap";
import { toRoadmapDiagnosis } from "@/lib/services/roadmap/fromRow";
import type { RoadmapProgress } from "@/lib/services/roadmap/types";

// 로드맵 단계 완료 토글. 현재 유효 상태(파생 or override)를 뒤집어 저장한다.
// self-eligible(= 'soon' 이 아닌) 단계만 토글 가능 — 레거시와 동일.
export async function toggleRoadmapStep(stepId: string): Promise<void> {
  if (!isValidStepId(stepId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();

  const { data: profile } = await svc
    .from("profiles")
    .select("roadmap_progress")
    .eq("id", user.id)
    .single();
  const progress = (profile?.roadmap_progress ?? {}) as RoadmapProgress;

  const { data: latest } = await svc
    .from("export_diagnosis_requests")
    .select(
      "eu_compliance_readiness, packaging_readiness, is_selling_in_korea, certifications, product_files"
    )
    .eq("member_id", user.id)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const built = buildRoadmap(latest ? toRoadmapDiagnosis(latest) : null, progress);
  const step = built.steps.find((s) => s.id === stepId);
  if (!step || step.link.type === "soon") return; // 준비 중 단계는 토글 불가

  const next = !step.done;
  const updated: RoadmapProgress = {
    ...progress,
    [stepId]: { done: next, doneAt: next ? new Date().toISOString() : null },
  };

  await svc.from("profiles").update({ roadmap_progress: updated }).eq("id", user.id);
  revalidatePath("/mypage");
}
