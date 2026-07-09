import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 서버 전용. 서비스 롤 키로 RLS 를 우회한다. 절대 클라이언트에서 import 하지 말 것.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
