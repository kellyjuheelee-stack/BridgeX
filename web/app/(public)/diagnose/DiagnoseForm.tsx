// web/app/(public)/diagnose/DiagnoseForm.tsx
"use client";

import { useRef, useState } from "react";
import {
  CHECKLIST_GROUPS,
  PRODUCT_CATEGORIES,
  TARGET_COUNTRIES,
} from "@/lib/constants/diagnosisChecklist";
import { submitDiagnosis } from "./actions";
import { DIAGNOSE_EXAMPLES } from "./exampleData";
import styles from "./diagnose.module.css";

// 모든 체크리스트 키(19개)를 단일 출처에서 도출 — 키 목록 중복 정의 금지
const ALL_CHECK_KEYS = CHECKLIST_GROUPS.flatMap((g) => g.items.map((i) => i.key));

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
  // 예제입력으로 채운 상태인지 — 예시 데이터는 실제 개인정보가 아니므로 동의 게이트를 건너뛴다.
  const [exampleLoaded, setExampleLoaded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const lastIdxRef = useRef(-1); // 직전 세트 인덱스(연속 중복 방지)

  function fillExample() {
    const form = formRef.current;
    if (!form) return;
    setExampleLoaded(true);
    setError("");

    // 1) 직전과 다른 랜덤 인덱스
    let idx = Math.floor(Math.random() * DIAGNOSE_EXAMPLES.length);
    if (DIAGNOSE_EXAMPLES.length > 1) {
      while (idx === lastIdxRef.current) {
        idx = Math.floor(Math.random() * DIAGNOSE_EXAMPLES.length);
      }
    }
    lastIdxRef.current = idx;
    const ex = DIAGNOSE_EXAMPLES[idx];

    // 2) 텍스트/셀렉트 필드
    const setVal = (name: string, value: string) => {
      const el = form.elements.namedItem(name) as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
      if (el && "value" in el) el.value = value;
    };
    setVal("contactName", ex.contactName);
    setVal("companyName", ex.companyName);
    setVal("email", ex.email);
    setVal("phone", ex.phone);
    setVal("homepageUrl", ex.homepageUrl ?? "");
    setVal("smartStoreUrl", ex.smartStoreUrl ?? "");
    setVal("instagramUrl", ex.instagramUrl ?? "");
    setVal("productName", ex.productName);
    setVal("productCategory", ex.productCategory);

    // 3) 목표 국가 (같은 name의 체크박스 그룹)
    form
      .querySelectorAll<HTMLInputElement>('input[name="targetCountries"]')
      .forEach((cb) => {
        cb.checked = ex.targetCountries.includes(cb.value);
      });

    // 4) 체크리스트 19개 — 세트에 없는 키는 false로 해제
    ALL_CHECK_KEYS.forEach((key) => {
      const cb = form.elements.namedItem(key) as HTMLInputElement | null;
      if (cb) cb.checked = !!ex.checks[key];
    });

    // 동의 체크박스는 의도적으로 건드리지 않음 (게이트 의미 유지)
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    // 예제입력으로 채운 경우 실제 개인정보가 아니므로 동의 없이도 진단을 진행한다.
    if (!consent && !exampleLoaded) {
      setError("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }
    setSubmitting(true);
    // Server Action 이 성공 시 결과 페이지로 redirect 한다.
    await submitDiagnosis(formData);
    setSubmitting(false);
  }

  return (
    <div className={styles.page}>
      <form action={handleSubmit} className={styles.form} ref={formRef}>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>수출 준비도 진단</h1>
          <button type="button" className={styles.exampleBtn} onClick={fillExample}>
            예제입력
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
            <Field label="대표 제품명" name="productName" required />
            <label className={`${styles.field} ${styles.colspan}`}>
              <span className={styles.floatLabel}>제품 카테고리</span>
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
