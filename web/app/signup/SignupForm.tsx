"use client";

import { useState } from "react";
import { signUp, signInWithGoogle } from "@/app/auth/actions";
import styles from "../auth.module.css";

export default function SignupForm({ serverError }: { serverError?: string }) {
  const [error, setError] = useState(serverError ?? "");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    const name = String(formData.get("name") ?? "").trim();
    const company = String(formData.get("company_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!name || !company || !email || !phone || !password) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("이메일 형식이 올바르지 않습니다.");
      return;
    }
    if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ""))) {
      setError("전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (!consent) {
      setError("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }

    setSubmitting(true);
    await signUp(formData); // 성공 시 서버 액션이 redirect
    setSubmitting(false);
  }

  return (
    <>
      <form action={handleSubmit} className={styles.form}>
      <h1 className={styles.h}>회원가입</h1>
      <p className={styles.sub}>간단히 가입하고 내 수출 진행 상황을 관리하세요.</p>

      <label className={styles.label}>이름</label>
      <input className={styles.input} name="name" autoComplete="name" placeholder="홍길동" />

      <label className={styles.label}>회사명</label>
      <input
        className={styles.input}
        name="company_name"
        autoComplete="organization"
        placeholder="브랜드/회사명"
      />

      <label className={styles.label}>이메일</label>
      <input
        className={styles.input}
        name="email"
        type="email"
        autoComplete="email"
        placeholder="hello@brand.com"
      />

      <label className={styles.label}>전화번호</label>
      <input
        className={styles.input}
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="010-1234-5678"
      />

      <label className={styles.label}>비밀번호</label>
      <input
        className={styles.input}
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="8자 이상"
      />

      <div className={styles.consentBox}>
        <label className={styles.consentCheck}>
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          개인정보 수집 및 이용에 동의합니다. <span className={styles.req}>*</span>
        </label>
        <p className={styles.consentText}>
          본 양식 제출 시 BridgeX의{" "}
          <a href="/terms" target="_blank" rel="noopener">
            이용약관
          </a>{" "}
          및{" "}
          <a href="/privacy" target="_blank" rel="noopener">
            개인정보처리방침
          </a>
          에 동의하게 됩니다.
        </p>
      </div>

      <div className={styles.err}>{error}</div>

      <button type="submit" className={styles.btn} disabled={submitting}>
        {submitting ? "가입 중…" : "가입하기"}
      </button>
      </form>

      <div className={styles.divider}>또는</div>

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

      <div className={styles.switch}>
        이미 회원이신가요? <a href="/login">로그인</a>
      </div>
    </>
  );
}
