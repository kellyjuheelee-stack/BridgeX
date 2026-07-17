"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function completeOnboarding(formData: FormData) {
  // 동의 필수 (서버 이중 검증)
  if (formData.get("consent") !== "on") {
    redirect(
      `/onboarding?error=${encodeURIComponent("개인정보 수집 및 이용에 동의해주세요.")}`
    );
  }
  const company = String(formData.get("company_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!company || !phone) {
    redirect(
      `/onboarding?error=${encodeURIComponent("회사명과 전화번호를 입력해주세요.")}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await svc
    .from("profiles")
    .update({
      company_name: company,
      phone,
      onboarded_at: now,
      consent_agreed_at: now,
    })
    .eq("id", user.id);
  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }
  // 온보딩 완료 후 홈으로 — 사용자가 마이페이지 메뉴로 진입.
  redirect("/");
}
