import SignupForm from "./SignupForm";
import HomeButton from "@/app/HomeButton";
import styles from "../auth.module.css";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  return (
    <main className={styles.page}>
      <HomeButton />
      <div className={styles.card}>
        <a href="/" className={styles.brand}>
          Bridge<span>X</span>
        </a>
        {sent ? (
          <div className={styles.done}>
            <div className={styles.doneIco}>✉︎</div>
            <h1 className={styles.h}>확인 메일을 보냈습니다</h1>
            <p>
              입력하신 이메일로 인증 링크를 보냈어요.
              <br />
              메일의 링크를 눌러 인증을 완료한 뒤 <strong>로그인</strong>해 주세요.
            </p>
            <a
              href="/login"
              className={styles.btn}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              로그인하러 가기
            </a>
          </div>
        ) : (
          <SignupForm serverError={error} />
        )}
      </div>
    </main>
  );
}
