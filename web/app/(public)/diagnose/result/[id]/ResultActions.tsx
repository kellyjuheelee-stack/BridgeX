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

// 이름·회사·전화·이메일 입력 필드 세트 (상담 모달 / 결과 저장 카드 공용)
function ContactFields({ prefill }: { prefill: Prefill }) {
  return (
    <>
      <div className={styles.field}>
        <label className={styles.floatLabel}>이름 *</label>
        <input
          className={styles.floatInput}
          name="contactName"
          type="text"
          defaultValue={prefill.contactName}
          required
        />
      </div>
      <div className={styles.field}>
        <label className={styles.floatLabel}>회사명</label>
        <input
          className={styles.floatInput}
          name="companyName"
          type="text"
          defaultValue={prefill.companyName}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.floatLabel}>전화번호</label>
        <input
          className={styles.floatInput}
          name="phone"
          type="tel"
          defaultValue={prefill.phone}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.floatLabel}>이메일 *</label>
        <input
          className={styles.floatInput}
          name="email"
          type="email"
          defaultValue={prefill.email}
          required
        />
      </div>
    </>
  );
}

function ConsentBlock() {
  return (
    <p className={styles.consentText}>
      입력하신 정보는 상담·서비스 제공 목적으로 수집·이용되며, BridgeX의{" "}
      <a href="/terms" target="_blank" rel="noopener">
        이용약관
      </a>{" "}
      및{" "}
      <a href="/privacy" target="_blank" rel="noopener">
        개인정보처리방침
      </a>
      에 동의하게 됩니다.
    </p>
  );
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
  // 상담 모달
  const [modalOpen, setModalOpen] = useState(false);
  const [consultDone, setConsultDone] = useState(false);
  const [consultConsent, setConsultConsent] = useState(false);
  const [consultErr, setConsultErr] = useState("");
  const [consultPending, setConsultPending] = useState(false);

  // 결과 저장(회원가입)
  const [signConsent, setSignConsent] = useState(false);
  const [signErr, setSignErr] = useState("");
  const [signPending, setSignPending] = useState(false);

  function openModal() {
    setConsultDone(false);
    setConsultErr("");
    setConsultConsent(false);
    setModalOpen(true);
  }

  async function submitConsult(fd: FormData) {
    setConsultErr("");
    if (!consultConsent) {
      setConsultErr("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }
    setConsultPending(true);
    const res = await requestConsultation(fd);
    setConsultPending(false);
    if (res?.ok) setConsultDone(true);
    else setConsultErr(res?.error ?? "신청 중 오류가 발생했습니다.");
  }

  async function submitSignup(fd: FormData) {
    setSignErr("");
    if (!signConsent) {
      setSignErr("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }
    setSignPending(true);
    // 성공 시 서버 액션이 /mypage 로 리다이렉트하므로 아래 코드는 실패한 경우에만 실행된다.
    const res = await signUpAndLink(fd);
    setSignPending(false);
    if (res?.error) setSignErr(res.error);
  }

  return (
    <div>
      <div className={`${styles.card} ${styles.ctaCard}`}>
        <h3 className={styles.ctaTitle}>전문가와 함께, 계약 테이블까지.</h3>
        <p className={styles.ctaText}>{pitch}</p>
        <button type="button" className={styles.btn} onClick={openModal}>
          무료 상담 신청 →
        </button>
        <p className={styles.basicNote}>30분 무료 상담 · K뷰티 EU 수출 특화</p>
      </div>

      {showSignup && (
        <div className={`${styles.card} ${styles.signupCard}`}>
          <h3 className={styles.signupTitle}>이 결과를 내 페이지에 저장하세요.</h3>
          <form className={styles.signupForm} action={submitSignup}>
            <input type="hidden" name="diagnosisId" value={diagnosisId} />
            <ContactFields prefill={prefill} />
            <label className={styles.consentRow}>
              <input
                type="checkbox"
                name="consent"
                checked={signConsent}
                onChange={(e) => setSignConsent(e.target.checked)}
              />
              개인정보 수집 및 이용에 동의합니다. *
            </label>
            <ConsentBlock />
            {signErr && <p className={styles.err}>{signErr}</p>}
            <button type="submit" className={styles.btn} disabled={signPending}>
              {signPending ? "처리 중…" : "가입하고 결과 저장하기"}
            </button>
            <p className={styles.signupHint}>
              비밀번호 없이 가입됩니다. 다음 접속 시에는 구글 로그인 또는 비밀번호 재설정으로 로그인하세요.
            </p>
          </form>
        </div>
      )}

      {/* ── 무료 상담 신청 모달 ── */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              aria-label="닫기"
              onClick={() => setModalOpen(false)}
            >
              ×
            </button>

            {consultDone ? (
              <div className={styles.modalDone}>
                <div className={styles.doneIcon}>✓</div>
                <h3>상담이 신청되었습니다.</h3>
                <p>담당 전문가가 입력하신 연락처로 곧 연락드리겠습니다.</p>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => setModalOpen(false)}
                >
                  확인
                </button>
              </div>
            ) : (
              <>
                <h3 className={styles.modalTitle}>무료 상담 신청</h3>
                <p className={styles.modalSub}>
                  기본 정보를 입력해 주세요. 30분 무료 상담을 도와드립니다.
                </p>
                <form className={styles.modalForm} action={submitConsult}>
                  <input type="hidden" name="diagnosisId" value={diagnosisId} />
                  <ContactFields prefill={prefill} />
                  <label className={styles.consentRow}>
                    <input
                      type="checkbox"
                      checked={consultConsent}
                      onChange={(e) => setConsultConsent(e.target.checked)}
                    />
                    개인정보 수집 및 이용에 동의합니다. *
                  </label>
                  <ConsentBlock />
                  {consultErr && <p className={styles.err}>{consultErr}</p>}
                  <button type="submit" className={styles.btn} disabled={consultPending}>
                    {consultPending ? "신청 중…" : "상담 신청하기"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
