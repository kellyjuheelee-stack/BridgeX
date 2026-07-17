"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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

  // 이메일 가입은 동의/회사/전화를 폼에서 이미 받았으므로 온보딩 완료로 스탬프.
  // (트리거가 profiles 행을 만든 뒤, 서비스 롤로 온보딩 시각 기록)
  if (data.user) {
    const svc = createServiceClient();
    const now = new Date().toISOString();
    await svc
      .from("profiles")
      .update({ onboarded_at: now, consent_agreed_at: now })
      .eq("id", data.user.id);
  }

  // Confirm email 이 켜져 있으면 세션이 아직 없다 → 확인 메일 안내 화면으로.
  if (!data.session) redirect("/signup?sent=1");
  // 로그인 직후 자동으로 마이페이지에 들어가지 않고 홈으로 — 사용자가 메뉴로 진입.
  redirect("/");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  // 로그인 직후 홈으로 — 사용자가 마이페이지 메뉴로 직접 진입.
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  // 세션·쿠키를 전역 범위로 완전히 폐기한다.
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const hdrs = await headers();
  // 프록시(Vercel) 뒤에서도 올바른 오리진 도출
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      // 로그아웃 후 다시 로그인할 때 자동 재로그인 대신 계정 선택창을 강제한다.
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data?.url) {
    redirect(
      `/login?error=${encodeURIComponent(error?.message ?? "구글 로그인을 시작할 수 없습니다.")}`
    );
  }
  redirect(data.url);
}
