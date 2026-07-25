// web/app/(public)/regulations/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

// 유럽 규제 페이지 상담 신청 — 개인정보를 받아 독립 상담 리드로 저장한다.
// 진단행이 아닌 규제 상담 소스로 표시하며, 리다이렉트 없이 결과를 반환해
// 모달에서 완료 화면을 띄운다.
export async function requestRegulationConsultation(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const contactName = str(formData, "contactName");
  const companyName = str(formData, "companyName");
  const phone = str(formData, "phone");
  const email = str(formData, "email");
  const topic = str(formData, "topic") || "EU 규제 상담";

  if (!contactName || !email || !phone) {
    return { ok: false, error: "이름·이메일·연락처를 입력해주세요." };
  }
  if (formData.get("consent") !== "on") {
    return { ok: false, error: "개인정보 수집 및 이용에 동의해주세요." };
  }

  // 회원 세션이면 member_id 연결
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date().toISOString();
  const admin = createServiceClient();
  const { error } = await admin.from("export_diagnosis_requests").insert({
    contact_name: contactName,
    company_name: companyName,
    email,
    phone,
    // 규제 상담은 제품 진단이 아니므로 맥락 컬럼은 상담용 값으로 채운다.
    product_name: topic,
    product_category: "규제 상담",
    is_selling_in_korea: "-",
    export_experience: "-",
    has_existing_buyer: "-",
    checklist_answers: { source: "regulations", topic },
    diagnosis_status: "consulting_needed",
    consultation_requested: true,
    consultation_requested_at: now,
    submitted_at: now,
    member_id: user?.id ?? null,
  });

  if (error) {
    return { ok: false, error: "신청 중 오류가 발생했습니다. 다시 시도해주세요." };
  }
  return { ok: true };
}
