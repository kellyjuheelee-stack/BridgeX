// web/app/(member)/tools/memberContext.ts
// 서버 전용. 회원 프로필 + 최신 진단행 → 이메일/답장 도구 컨텍스트.
// 레거시 member.service.js 의 getEmailContext / getLatestDiagnosisId 와 동일한 매핑.
// 절대 "use client" 파일에서 import 하지 말 것 (service 클라이언트 사용).
import { createServiceClient } from "@/lib/supabase/service";
import type { EmailContext } from "@/lib/services/email/templates";

const SELLING = ["판매 중", "테스트 판매 중"];

export interface LoadedMemberContext {
  ctx: EmailContext;
  diagnosisId: string | null;
  hasDiagnosis: boolean;
}

interface DiagnosisContextRow {
  id: string;
  company_name: string | null;
  product_name: string | null;
  product_category: string | null;
  target_countries: string[] | null;
  certifications: string[] | null;
  volume_and_price_range: string | null;
  monthly_sales_or_best_seller: string | null;
  is_selling_in_korea: string | null;
}

export async function loadMemberContext(userId: string): Promise<LoadedMemberContext> {
  const svc = createServiceClient();

  const { data: profile } = await svc
    .from("profiles")
    .select("name, company_name")
    .eq("id", userId)
    .single();

  const { data: d } = await svc
    .from("export_diagnosis_requests")
    .select(
      "id, company_name, product_name, product_category, target_countries, certifications, volume_and_price_range, monthly_sales_or_best_seller, is_selling_in_korea"
    )
    .eq("member_id", userId)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle<DiagnosisContextRow>();

  const ctx: EmailContext = {
    contactName: profile?.name || "",
    brand: profile?.company_name || d?.company_name || "",
    product: d?.product_name || "",
    category: d?.product_category || "",
    countries: d?.target_countries || [],
    certs: d?.certifications || [],
    price: d?.volume_and_price_range || "",
    sales: d?.monthly_sales_or_best_seller || "",
    sellingInKorea: d ? SELLING.includes(d.is_selling_in_korea || "") : false,
  };

  return { ctx, diagnosisId: d?.id ?? null, hasDiagnosis: !!d };
}
