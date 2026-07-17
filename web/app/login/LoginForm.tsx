"use client";

import { useState } from "react";
import { signIn, signInWithGoogle } from "@/app/auth/actions";
import styles from "../auth.module.css";

export default function LoginForm({ serverError }: { serverError?: string }) {
  const [error, setError] = useState(serverError ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    await signIn(formData); // 성공 시 서버 액션이 redirect
    setSubmitting(false);
  }

  return (
    <>
      <h1 className={styles.h}>로그인</h1>
      <p className={styles.sub}>가입하신 이메일과 비밀번호로 로그인하세요.</p>

      <form action={signInWithGoogle}>
        <button type="submit" className={styles.oauthBtn}>
          <svg className={styles.oauthG} viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          Google로 계속하기
        </button>
      </form>

      <div className={styles.divider}>또는</div>

      <form action={handleSubmit} className={styles.form}>
      <label className={styles.label}>이메일</label>
      <input
        className={styles.input}
        name="email"
        type="email"
        autoComplete="email"
        placeholder="hello@brand.com"
      />

      <label className={styles.label}>비밀번호</label>
      <input
        className={styles.input}
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="비밀번호"
      />

      <div className={styles.err}>{error}</div>

      <button type="submit" className={styles.btn} disabled={submitting}>
        {submitting ? "로그인 중…" : "로그인"}
      </button>
      </form>

      <div className={styles.switch}>
        아직 회원이 아니신가요? <a href="/signup">회원가입</a>
      </div>
    </>
  );
}
