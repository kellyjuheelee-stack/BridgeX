"use client";

// 유럽 규제 허브 하단 CTA — "상담 신청" 버튼 → 개인정보 입력 모달 → 완료 표시.
import { useState } from "react";
import { requestRegulationConsultation } from "./actions";
import styles from "./regulations.module.css";

export default function ConsultCta() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    // 닫힐 때 상태 초기화(다음 오픈 시 폼부터)
    setTimeout(() => {
      setDone(false);
      setError(null);
      setLoading(false);
    }, 200);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await requestRegulationConsultation(fd);
    setLoading(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "신청 중 오류가 발생했습니다.");
  }

  return (
    <>
      <div className={styles.ctaBand}>
        <h2>우리 브랜드는 규제 준비가 됐을까요?</h2>
        <button type="button" className={styles.ctaBtn} onClick={() => setOpen(true)}>
          상담 신청하기 →
        </button>
      </div>

      {open && (
        <div className={styles.modalOverlay} onClick={close} role="presentation">
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consult-title"
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={close}
              aria-label="닫기"
            >
              ×
            </button>

            {done ? (
              <div className={styles.modalDone}>
                <div className={styles.doneCheck} aria-hidden="true">
                  ✓
                </div>
                <h3 id="consult-title">상담신청 완료</h3>
                <p>
                  상담 신청이 정상적으로 접수되었습니다.
                  <br />
                  담당자가 입력하신 연락처로 곧 연락드리겠습니다.
                </p>
                <button type="button" className={styles.modalBtn} onClick={close}>
                  확인
                </button>
              </div>
            ) : (
              <form className={styles.modalForm} onSubmit={onSubmit}>
                <h3 id="consult-title">규제 대응 상담 신청</h3>
                <p className={styles.modalSub}>
                  아래 정보를 남겨주시면 담당자가 연락드립니다.
                </p>

                <label className={styles.field}>
                  <span>
                    이름 <b>*</b>
                  </span>
                  <input name="contactName" type="text" required autoComplete="name" />
                </label>
                <label className={styles.field}>
                  <span>회사명</span>
                  <input name="companyName" type="text" autoComplete="organization" />
                </label>
                <label className={styles.field}>
                  <span>
                    연락처 <b>*</b>
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="010-0000-0000"
                  />
                </label>
                <label className={styles.field}>
                  <span>
                    이메일 <b>*</b>
                  </span>
                  <input name="email" type="email" required autoComplete="email" />
                </label>

                <label className={styles.consentRow}>
                  <input name="consent" type="checkbox" required />
                  <span>
                    개인정보 수집·이용에 동의합니다.{" "}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer">
                      개인정보처리방침
                    </a>
                  </span>
                </label>

                {error && <div className={styles.modalError}>{error}</div>}

                <button
                  type="submit"
                  className={styles.modalBtn}
                  disabled={loading}
                >
                  {loading ? "신청 중…" : "상담 신청"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
