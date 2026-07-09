// web/app/(member)/tools/reply/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import ReplyTool from "./ReplyTool";
import styles from "../tools.module.css";

export const dynamic = "force-dynamic";

export default async function ReplyToolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
          <h1>바이어 답장 대응</h1>
          <p>
            바이어에게서 받은 <b>답장을 붙여넣으면</b>, 무엇을 원하는지 분석해 <b>영문 대응 초안</b>을 만들어 드립니다.
          </p>
        </div>
        <ReplyTool />
      </div>
    </div>
  );
}
