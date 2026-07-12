"use client";

import { useState } from "react";
import { signIn } from "@/app/auth/actions";
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
    <form action={handleSubmit} className={styles.form}>
      <h1 className={styles.h}>로그인</h1>
      <p className={styles.sub}>가입하신 이메일과 비밀번호로 로그인하세요.</p>

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

      <div className={styles.switch}>
        아직 회원이 아니신가요? <a href="/signup">회원가입</a>
      </div>
    </form>
  );
}
