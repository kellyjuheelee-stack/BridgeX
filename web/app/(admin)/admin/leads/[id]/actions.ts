// web/app/(admin)/admin/leads/[id]/actions.ts
// 관리자 백오피스 서버 액션. 모든 액션은 requireAdmin 게이트 후 서비스 롤로 기록한다.
// meetings / consulting_checklist 는 jsonb — 현재 행을 읽어 통째로 수정 후 다시 쓴다(read-modify-write).
"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";

export interface Meeting {
  id: string;
  title: string;
  type: "online" | "offline";
  scheduledAt: string | null;
  location: string;
  status: string;
}

function revalidate(id: string) {
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}

// 컨설팅 트랙 업데이트 (단계 + 체크리스트 + 메모).
// 레거시(diagnosis.service.updateConsulting)는 diagnosis_status 를 변경하지 않는다 — 동일하게 유지.
export async function updateConsulting(
  id: string,
  patch: { stage?: string; checklist?: Record<string, boolean>; notes?: string }
): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();

  const update: Record<string, unknown> = {};
  if (patch.stage !== undefined) update.consulting_stage = patch.stage;
  if (patch.checklist !== undefined) update.consulting_checklist = patch.checklist;
  if (patch.notes !== undefined) update.consulting_notes = patch.notes;
  if (Object.keys(update).length === 0) return;

  await svc.from("export_diagnosis_requests").update(update).eq("id", id);
  revalidate(id);
}

// 미팅 추가 (jsonb append). id 는 서버에서 randomUUID 로 생성.
export async function addMeeting(
  id: string,
  input: { title?: string; type?: string; scheduledAt?: string | null; location?: string }
): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();

  const { data } = await svc
    .from("export_diagnosis_requests")
    .select("meetings")
    .eq("id", id)
    .single();
  if (!data) return;

  const meetings: Meeting[] = Array.isArray(data.meetings) ? (data.meetings as Meeting[]) : [];
  meetings.push({
    id: randomUUID(),
    title: (input.title && input.title.trim()) || "상담 미팅",
    type: input.type === "offline" ? "offline" : "online",
    scheduledAt: input.scheduledAt || null,
    location: input.location ? input.location.trim() : "",
    status: "scheduled",
  });

  await svc.from("export_diagnosis_requests").update({ meetings }).eq("id", id);
  revalidate(id);
}

// 미팅 삭제 (jsonb filter).
export async function deleteMeeting(id: string, meetingId: string): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();

  const { data } = await svc
    .from("export_diagnosis_requests")
    .select("meetings")
    .eq("id", id)
    .single();
  if (!data) return;

  const meetings: Meeting[] = (Array.isArray(data.meetings) ? (data.meetings as Meeting[]) : []).filter(
    (m) => m.id !== meetingId
  );

  await svc.from("export_diagnosis_requests").update({ meetings }).eq("id", id);
  revalidate(id);
}

// 진단 상태 변경.
export async function setStatus(id: string, status: string): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  await svc.from("export_diagnosis_requests").update({ diagnosis_status: status }).eq("id", id);
  revalidate(id);
}

// 관리자 메모 저장.
export async function updateMemo(id: string, memo: string): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  await svc.from("export_diagnosis_requests").update({ admin_memo: memo }).eq("id", id);
  revalidate(id);
}

// 상태 + 메모 통합 저장 (레거시 PATCH /:id/status 와 동일 — admin.html 의 단일 '저장' 버튼).
export async function saveAdminMeta(
  id: string,
  input: { status: string; memo: string }
): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  await svc
    .from("export_diagnosis_requests")
    .update({ diagnosis_status: input.status, admin_memo: input.memo })
    .eq("id", id);
  revalidate(id);
}
