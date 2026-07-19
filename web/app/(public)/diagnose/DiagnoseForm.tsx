// web/app/(public)/diagnose/DiagnoseForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CHECKLIST_GROUPS,
  PRODUCT_CATEGORIES,
  TARGET_COUNTRIES,
} from "@/lib/constants/diagnosisChecklist";
import { submitDiagnosis } from "./actions";
import styles from "./diagnose.module.css";

interface Prefill {
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
}

export default function DiagnoseForm({ prefill, isMember }: { prefill: Prefill; isMember: boolean }) {
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // onSubmit 핸들러로 처리한다. (form action 은 트랜지션 내부라 setState 로딩 화면이
  // 리다이렉트 전에 페인트되지 않음 — 일반 이벤트 핸들러의 urgent 업데이트로 로딩 화면을 확실히 노출)
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!consent) {
      setError("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    setSubmitting(true);
    // 규칙 기반 진단은 즉시 끝나므로, 결과 이동 전 로딩 화면이 확실히 보이도록 최소 노출 시간을 둔다.
    await new Promise((r) => setTimeout(r, 1600));
    // Server Action 이 성공 시 결과 페이지로 redirect 한다.
    await submitDiagnosis(formData);
    setSubmitting(false);
  }

  return (
    <div className={styles.page}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.homeBtn} aria-label="홈으로">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path
                d="M3.5 9.5 10 4l6.5 5.5M5.5 8.5V15a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            홈
          </Link>
        </div>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>수출 준비도 진단</h1>
          <button
            type="button"
            className={styles.exampleBtn}
            onClick={() => window.open("/diagnose/sample", "_blank", "noopener")}
          >
            샘플 보기
          </button>
        </div>
        <p className={styles.pageSub}>
          우리 브랜드의 EU 수출 준비 상태를 항목별로 진단해 드립니다. 해당되는 정보를 입력해 주세요.
        </p>

        {/* 시작 정보 */}
        <section className={styles.card}>
          <h2 className={styles.cardHead}>시작 정보</h2>
          <div className={styles.grid}>
            <Field label="담당자명" name="contactName" defaultValue={prefill.contactName} required />
            <Field label="회사명" name="companyName" defaultValue={prefill.companyName} required />
            <Field label="이메일" name="email" type="email" defaultValue={prefill.email} required />
            <Field label="전화번호" name="phone" type="tel" defaultValue={prefill.phone} required />
            <Field label="홈페이지 (선택)" name="homepageUrl" type="url" placeholder="https://" />
            <Field label="스마트스토어 (선택)" name="smartStoreUrl" type="url" placeholder="https://" />
            <Field label="인스타그램 (선택)" name="instagramUrl" type="url" placeholder="https://" />
            <Field label="대표 제품명 (선택)" name="productName" />
            <label className={`${styles.field} ${styles.colspan}`}>
              <span className={styles.floatLabel}>
                제품 카테고리 <span className={styles.req}>*</span>
              </span>
              <select name="productCategory" required defaultValue="" className={styles.floatSelect}>
                <option value="" disabled>
                  선택하세요
                </option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* 목표 국가 */}
        <section className={styles.card}>
          <h2 className={styles.cardHead}>목표 국가</h2>
          <p className={styles.cardNote}>수출을 고려하는 국가를 모두 선택하세요.</p>
          <div className={styles.optionGrid}>
            {TARGET_COUNTRIES.map((c) => (
              <label key={c} className={styles.optionCard}>
                <input type="checkbox" name="targetCountries" value={c} />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </section>

        {/* 준비도 체크리스트 */}
        {CHECKLIST_GROUPS.map((g, i) => (
          <section key={`${g.area}-${i}`} className={styles.card}>
            <h2 className={styles.cardHead}>{g.title}</h2>
            {g.note && <p className={styles.cardNote}>{g.note}</p>}
            <div className={`${styles.optionGrid} ${styles.optionGridWide}`}>
              {g.items.map((it) => (
                <label key={it.key} className={styles.optionCard}>
                  <input type="checkbox" name={it.key} value="1" />
                  <span>{it.label}</span>
                </label>
              ))}
            </div>
          </section>
        ))}

        {/* 필수 동의 게이트 */}
        <div className={styles.consentBox}>
          <label className={styles.consentCheck}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              개인정보 수집 및 이용에 동의합니다. <span className={styles.req}>*</span>
            </span>
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
          {error && <p className={styles.err}>{error}</p>}
        </div>

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "진단 중..." : "수출 가능성 진단하기"}
        </button>
      </form>

      {submitting && (
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <div className={styles.loadingCard}>
            <span className={styles.spinner} aria-hidden="true" />
            <p className={styles.loadingTitle}>수출 준비도를 진단하고 있어요</p>
            <p className={styles.loadingSub}>
              입력하신 정보를 항목별로 분석하는 중입니다. 잠시만 기다려 주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.floatLabel}>{label}</span>
      <input
        className={styles.floatInput}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
