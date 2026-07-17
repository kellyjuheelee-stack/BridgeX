// web/app/(public)/diagnose/result/[id]/ResultActions.tsx
"use client";

import { useState } from "react";
import { requestConsultation, signUpAndLink } from "../../actions";
import styles from "./result.module.css";

interface Prefill {
  email: string;
  contactName: string;
  companyName: string;
  phone: string;
}

export default function ResultActions({
  diagnosisId,
  pitch,
  showSignup,
  prefill,
}: {
  diagnosisId: string;
  pitch: string;
  showSignup: boolean;
  prefill: Prefill;
}) {
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  return (
    <div>
      <div className={`${styles.card} ${styles.ctaCard}`}>
        <h3 className={styles.ctaTitle}>전문가와 함께, 계약 테이블까지.</h3>
        <p className={styles.ctaText}>{pitch}</p>
        <form className={styles.ctaForm} action={requestConsultation.bind(null, diagnosisId)}>
          <button type="submit" className={styles.btn}>
            무료 상담 신청 →
          </button>
        </form>
        <p className={styles.basicNote}>30분 무료 상담 · K뷰티 EU 수출 특화</p>
      </div>

      {showSignup && (
        <div className={`${styles.card} ${styles.signupCard}`}>
          <h3 className={styles.signupTitle}>이 결과를 내 페이지에 저장하세요.</h3>
          <form
            className={styles.signupForm}
            action={(fd) => {
              setError("");
              if (!consent) {
                setError("개인정보 수집 및 이용에 동의해주세요.");
                return;
              }
              signUpAndLink(fd);
            }}
          >
            <input type="hidden" name="diagnosisId" value={diagnosisId} />
            <input type="hidden" name="email" value={prefill.email} />
            <input type="hidden" name="contactName" value={prefill.contactName} />
            <input type="hidden" name="companyName" value={prefill.companyName} />
            <input type="hidden" name="phone" value={prefill.phone} />
            <div className={styles.field}>
              <label className={styles.floatLabel}>비밀번호 (8자 이상)</label>
              <input className={styles.floatInput} name="password" type="password" minLength={8} required />
            </div>
            <label className={styles.consentRow}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              개인정보 수집 및 이용에 동의합니다. *
            </label>
            <p className={styles.consentText}>
              가입 시 BridgeX의{" "}
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
            <button type="submit" className={styles.btn}>
              가입하고 결과 저장
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
