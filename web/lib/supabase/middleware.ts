import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOnboarded } from "@/lib/auth/onboarding";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// 온보딩 게이트에서 제외할 경로 (로그인 없이 접근 가능하거나 온보딩 자체/콜백)
const ONBOARDING_EXEMPT = [
  "/onboarding",
  "/auth/callback",
  "/login",
  "/signup",
  "/terms",
  "/privacy",
  "/diagnose",
];

function isExempt(pathname: string): boolean {
  if (pathname === "/") return true;
  return ONBOARDING_EXEMPT.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 + 사용자 조회
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 온보딩 게이트: 로그인했지만 미온보딩이고 보호 경로면 /onboarding 으로
  const { pathname } = request.nextUrl;
  if (user && !isExempt(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .single();
    if (!isOnboarded(profile)) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
