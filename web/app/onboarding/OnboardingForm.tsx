"use client";

import { useState } from "react";
import { completeOnboarding } from "./actions";
import styles from "../auth.module.css";

export default function OnboardingForm({
  serverError,
  defaultCompany,
}: {
  serverError?: string;
  defaultCompany?: string;
}) {
  const [error, setError] = useState(serverError ?? "");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    const company = String(formData.get("company_name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    if (!company || !phone) {
      setError("회사명과 전화번호를 입력해주세요.");
      return;
    }
    if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ""))) {
      setError("전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)");
      return;
    }
    if (!consent) {
      setError("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }
    setSubmitting(true);
    await completeOnboarding(formData); // 성공 시 서버 액션이 redirect
    setSubmitting(false);
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <h1 className={styles.h}>가입 정보를 마저 입력해주세요</h1>
      <p className={styles.sub}>서비스 이용을 위해 아래 정보가 필요합니다.</p>

      <label className={styles.label}>회사명</label>
      <input
        className={styles.input}
        name="company_name"
        autoComplete="organization"
        defaultValue={defaultCompany ?? ""}
        placeholder="브랜드/회사명"
      />

      <label className={styles.label}>전화번호</label>
      <input
        className={styles.input}
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="010-1234-5678"
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
          제출 시 BridgeX의{" "}
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
        {submitting ? "저장 중…" : "시작하기"}
      </button>
    </form>
  );
}
