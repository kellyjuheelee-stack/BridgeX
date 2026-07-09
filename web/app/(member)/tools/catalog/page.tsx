// web/app/(member)/tools/catalog/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { loadMemberContext } from "../memberContext";
import CatalogTool from "./CatalogTool";
import styles from "../tools.module.css";

export const dynamic = "force-dynamic";

export default async function CatalogToolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { diagnosisId } = await loadMemberContext(user.id);

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a href="/mypage" className={styles.logo}>
          Bridge<span>X</span>
        </a>
        <div className={styles.navRight}>
          <a href="/mypage" className={styles.navLink}>
            내 페이지
          </a>
          <form action={signOut}>
            <button type="submit" className={styles.navLink}>
              로그아웃
            </button>
          </form>
        </div>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.head}>
          <h1>카탈로그 EU 점검</h1>
          <p>
            카탈로그·상세페이지의 <b>제품 설명·문구</b>를 붙여넣으면, EU 시장에서 <b>자주 지적되는 표현</b>을 짚어드립니다.
          </p>
        </div>
        <CatalogTool diagnosisId={diagnosisId} />
      </div>
    </div>
  );
}
