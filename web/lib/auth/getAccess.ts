import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveAccess, type Access } from "@/lib/auth/access";

// 현재 요청의 권한을 판정한다. 서버 전용 (next/headers + 서비스 롤 사용).
export async function getAccess(): Promise<{
  access: Access;
  userId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { access: "anon", userId: null };

  // is_admin 은 서버(서비스 롤)로 조회 — RLS 우회, 신뢰 가능한 판정
  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return { access: resolveAccess(user, profile), userId: user.id };
}
