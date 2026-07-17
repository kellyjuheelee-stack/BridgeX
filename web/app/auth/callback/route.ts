import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOnboarded } from "@/lib/auth/onboarding";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // 프록시 뒤 올바른 오리진
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("인증 코드가 없습니다.")}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // 온보딩 여부로 분기 (서비스 롤로 신뢰 가능한 판정)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("세션 확인에 실패했습니다.")}`
    );
  }
  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .single();

  const dest = isOnboarded(profile) ? "/mypage" : "/onboarding";
  return NextResponse.redirect(`${origin}${dest}`);
}
