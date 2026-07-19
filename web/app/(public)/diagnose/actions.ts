// web/app/(public)/diagnose/actions.ts
"use server";

import { randomBytes } from "node:crypto";
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
  const productCategory = str(formData, "productCategory");
  if (!contactName || !email || !productCategory) {
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

// 무료 상담 신청 — 모달에서 기본 정보(이름·회사·전화·이메일)를 받아 저장하고
// 상담 요청 플래그를 세운다. 리다이렉트 없이 결과를 반환해 모달에서 완료 화면을 띄운다.
export async function requestConsultation(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const id = str(formData, "diagnosisId");
  const contactName = str(formData, "contactName");
  const companyName = str(formData, "companyName");
  const phone = str(formData, "phone");
  const email = str(formData, "email");

  if (!id) return { ok: false, error: "잘못된 요청입니다." };
  if (!contactName || !email) {
    return { ok: false, error: "이름과 이메일을 입력해주세요." };
  }

  const admin = createServiceClient();
  const { error } = await admin
    .from("export_diagnosis_requests")
    .update({
      contact_name: contactName,
      company_name: companyName,
      phone,
      email,
      consultation_requested: true,
      consultation_requested_at: new Date().toISOString(),
      diagnosis_status: "consulting_needed",
    })
    .eq("id", id);

  if (error) return { ok: false, error: "신청 중 오류가 발생했습니다. 다시 시도해주세요." };
  return { ok: true };
}

// 결과 저장 회원가입 — 비밀번호 없이 기본 정보만으로 즉시 가입.
// 이메일 확인이 켜져 있어도 바로 마이페이지에 들어갈 수 있도록,
// 서비스 롤로 이메일 확인된 계정을 임시 비밀번호로 생성한 뒤 그 비밀번호로 자동 로그인한다.
// (사용자는 비밀번호를 모르므로 재로그인은 구글 로그인 또는 비밀번호 재설정 이용)
export async function signUpAndLink(
  formData: FormData
): Promise<{ error: string } | void> {
  const diagnosisId = str(formData, "diagnosisId");
  const email = str(formData, "email");
  const companyName = str(formData, "companyName");
  const contactName = str(formData, "contactName");
  const phone = str(formData, "phone");

  if (!email || !contactName) return { error: "이름과 이메일을 입력해주세요." };
  if (formData.get("consent") !== "on") {
    return { error: "개인정보 수집 및 이용에 동의해주세요." };
  }

  const admin = createServiceClient();
  const tempPassword = randomBytes(24).toString("base64url");
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name: contactName, company_name: companyName, phone },
  });
  if (createErr || !created?.user) {
    const already = /already|registered|exist/i.test(createErr?.message ?? "");
    return {
      error: already
        ? "이미 가입된 이메일입니다. 로그인 후 결과를 저장해주세요."
        : createErr?.message ?? "가입에 실패했습니다. 다시 시도해주세요.",
    };
  }

  // 트리거로 생성된 profiles 행에 온보딩·동의 시각 스탬프 (온보딩 게이트 통과용)
  const now = new Date().toISOString();
  await admin
    .from("profiles")
    .update({ onboarded_at: now, consent_agreed_at: now })
    .eq("id", created.user.id);

  // 비회원 진단행을 새 uid 로 원자적 연결 (member_id 가 아직 null 인 행만)
  await admin
    .from("export_diagnosis_requests")
    .update({ member_id: created.user.id })
    .eq("id", diagnosisId)
    .is("member_id", null);

  // 임시 비밀번호로 자동 로그인 → 세션 쿠키 확립
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password: tempPassword,
  });
  if (signInErr) {
    return { error: "로그인 처리에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  redirect("/mypage");
}
