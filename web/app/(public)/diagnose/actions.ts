// web/app/(public)/diagnose/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { CHECKLIST_GROUPS } from "@/lib/constants/diagnosisChecklist";
import { generateDiagnosis } from "@/lib/services/diagnosis/generateDiagnosis";
import { toRow, type DiagnoseInput } from "@/lib/services/diagnosis/toRow";
import type { ChecklistAnswers } from "@/lib/services/diagnosis/types";

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function orNull(fd: FormData, k: string): string | null {
  const v = str(fd, k);
  return v === "" ? null : v;
}

export async function submitDiagnosis(formData: FormData): Promise<void> {
  // 필수 동의 서버측 재확인 (클라이언트 게이트 우회 방지)
  // 폼은 동의 시에만 제출되지만, 서버에서도 최소 필수값을 검증한다.
  const contactName = str(formData, "contactName");
  const email = str(formData, "email");
  if (!contactName || !email) {
    redirect("/diagnose?error=" + encodeURIComponent("필수 정보를 입력해주세요."));
  }

  // 체크리스트 응답 조립: 각 key 의 checkbox 존재 여부 → boolean
  const answers = { companyName: str(formData, "companyName") } as ChecklistAnswers;
  for (const g of CHECKLIST_GROUPS) {
    for (const it of g.items) {
      (answers as Record<string, unknown>)[it.key] = formData.get(it.key) != null;
    }
  }

  // 회원 세션이면 member_id 연결
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const input: DiagnoseInput = {
    contact: {
      contactName,
      companyName: str(formData, "companyName"),
      email,
      phone: str(formData, "phone"),
      homepageUrl: orNull(formData, "homepageUrl"),
      smartStoreUrl: orNull(formData, "smartStoreUrl"),
      instagramUrl: orNull(formData, "instagramUrl"),
    },
    product: {
      productName: str(formData, "productName"),
      productCategory: str(formData, "productCategory"),
      targetCountries: formData.getAll("targetCountries").map(String),
    },
    answers,
    consentedAt: new Date().toISOString(),
    memberId: user?.id ?? null,
  };

  const result = generateDiagnosis(answers);
  const row = toRow(input, result);

  // 쓰기는 서비스롤(RLS 우회)
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("export_diagnosis_requests")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    redirect("/diagnose?error=" + encodeURIComponent("제출 중 오류가 발생했습니다. 다시 시도해주세요."));
  }

  redirect(`/diagnose/result/${data!.id}`);
}

export async function requestConsultation(id: string): Promise<void> {
  const admin = createServiceClient();
  await admin
    .from("export_diagnosis_requests")
    .update({
      consultation_requested: true,
      consultation_requested_at: new Date().toISOString(),
      diagnosis_status: "consulting_needed",
    })
    .eq("id", id);
  redirect(`/diagnose/result/${id}?consulted=1`);
}

export async function signUpAndLink(formData: FormData): Promise<void> {
  const diagnosisId = str(formData, "diagnosisId");
  const email = str(formData, "email");
  const password = str(formData, "password");
  const companyName = str(formData, "companyName");
  const contactName = str(formData, "contactName");
  const phone = str(formData, "phone");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: contactName, company_name: companyName, phone } },
  });
  if (error || !data.user) {
    redirect(`/diagnose/result/${diagnosisId}?error=` + encodeURIComponent(error?.message ?? "가입 실패"));
  }

  // 비회원 진단행을 새 uid 로 원자적 연결 (member_id 가 아직 null 인 행만)
  const admin = createServiceClient();
  await admin
    .from("export_diagnosis_requests")
    .update({ member_id: data!.user!.id })
    .eq("id", diagnosisId)
    .is("member_id", null);

  redirect("/mypage");
}
