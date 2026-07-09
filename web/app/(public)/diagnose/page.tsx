// web/app/(public)/diagnose/page.tsx
import { createClient } from "@/lib/supabase/server";
import DiagnoseForm from "./DiagnoseForm";

export default async function DiagnosePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let prefill = { contactName: "", companyName: "", email: "", phone: "" };
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, company_name, phone")
      .eq("id", user.id)
      .single();
    prefill = {
      contactName: profile?.name ?? "",
      companyName: profile?.company_name ?? "",
      email: user.email ?? "",
      phone: profile?.phone ?? "",
    };
  }

  return <DiagnoseForm prefill={prefill} isMember={!!user} />;
}
