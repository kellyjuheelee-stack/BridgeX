// web/app/(member)/tools/email/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { templatesMeta } from "@/lib/services/email/templates";
import EmailTool from "./EmailTool";
import styles from "../tools.module.css";

export const dynamic = "force-dynamic";

export default async function EmailToolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const templates = templatesMeta();

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
          <h1>AI 이메일 작성 도구</h1>
          <p>
            상황을 고르고 바이어 정보만 입력하면, 내 제품 정보로 <b>영문 이메일 초안</b>을 만들어드립니다. 복사해서 바로 쓰세요.
          </p>
        </div>
        <EmailTool templates={templates} />
      </div>
    </div>
  );
}
