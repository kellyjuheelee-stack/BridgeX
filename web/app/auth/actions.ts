"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  // 개인정보 수집·이용 동의는 필수 (클라이언트 게이트 + 서버 이중 검증)
  if (formData.get("consent") !== "on") {
    redirect(
      `/signup?error=${encodeURIComponent("개인정보 수집 및 이용에 동의해주세요.")}`
    );
  }
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: String(formData.get("name") ?? ""),
        company_name: String(formData.get("company_name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
      },
    },
  });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  // Confirm email 이 켜져 있으면 세션이 아직 없다 → 확인 메일 안내 화면으로.
  if (!data.session) redirect("/signup?sent=1");
  redirect("/mypage");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/mypage");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
