import LoginForm from "./LoginForm";
import HomeButton from "@/app/HomeButton";
import styles from "../auth.module.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className={styles.page}>
      <HomeButton />
      <div className={styles.card}>
        <a href="/" className={styles.brand}>
          Bridge<span>X</span>
        </a>
        <LoginForm serverError={error} />
      </div>
    </main>
  );
}
