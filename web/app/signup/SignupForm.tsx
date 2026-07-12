"use client";

import { useState } from "react";
import { signUp } from "@/app/auth/actions";
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

      <div className={styles.switch}>
        이미 회원이신가요? <a href="/login">로그인</a>
      </div>
    </form>
  );
}
