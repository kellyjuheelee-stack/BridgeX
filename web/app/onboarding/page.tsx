import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOnboarded } from "@/lib/auth/onboarding";
import OnboardingForm from "./OnboardingForm";
import styles from "../auth.module.css";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("onboarded_at, company_name")
    .eq("id", user.id)
    .single();

  // 이미 온보딩 완료면 마이페이지로
  if (isOnboarded(profile)) redirect("/mypage");

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.brand}>
          Bridge<span>X</span>
        </a>
        <OnboardingForm
          serverError={error}
          defaultCompany={profile?.company_name || ""}
        />
      </div>
    </main>
  );
}
