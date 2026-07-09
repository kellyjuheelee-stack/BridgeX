// web/app/(public)/diagnose/result/[id]/ResultActions.tsx
"use client";

import { useState } from "react";
import { requestConsultation, signUpAndLink } from "../../actions";

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
    <section style={{ marginTop: 32 }}>
      <div style={{ padding: 16, background: "rgba(0,102,204,0.06)", borderRadius: 12 }}>
        <p>{pitch}</p>
        <form action={requestConsultation.bind(null, diagnosisId)}>
          <button type="submit">무료 상담 신청</button>
        </form>
      </div>

      {showSignup && (
        <div style={{ marginTop: 24 }}>
          <h3>이 결과를 내 페이지에 저장하세요.</h3>
          <form
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
            <input name="password" type="password" placeholder="비밀번호 (8자 이상)" minLength={8} required />
            <label style={{ display: "flex", gap: 9, marginTop: 12, fontWeight: 600 }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              개인정보 수집 및 이용에 동의합니다. *
            </label>
            <p style={{ fontSize: 12.5, color: "#6e6e73", marginTop: 8 }}>
              가입 시 BridgeX의 <a href="/terms" target="_blank" rel="noopener">이용약관</a> 및{" "}
              <a href="/privacy" target="_blank" rel="noopener">개인정보처리방침</a>에 동의하게 됩니다.
            </p>
            {error && <p style={{ color: "#d64545", fontWeight: 600 }}>{error}</p>}
            <button type="submit">가입하고 결과 저장</button>
          </form>
        </div>
      )}
    </section>
  );
}
