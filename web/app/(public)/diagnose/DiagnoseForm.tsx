// web/app/(public)/diagnose/DiagnoseForm.tsx
"use client";

import { useState } from "react";
import {
  CHECKLIST_GROUPS,
  PRODUCT_CATEGORIES,
  TARGET_COUNTRIES,
} from "@/lib/constants/diagnosisChecklist";
import { submitDiagnosis } from "./actions";

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

  async function handleSubmit(formData: FormData) {
    setError("");
    if (!consent) {
      setError("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }
    setSubmitting(true);
    // Server Action 이 성공 시 결과 페이지로 redirect 한다.
    await submitDiagnosis(formData);
    setSubmitting(false);
  }

  return (
    <form action={handleSubmit} style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1>수출 준비도 진단</h1>

      {/* 시작 정보 */}
      <fieldset>
        <legend>시작 정보</legend>
        <input name="contactName" placeholder="담당자명" defaultValue={prefill.contactName} required />
        <input name="companyName" placeholder="회사명" defaultValue={prefill.companyName} required />
        <input name="email" type="email" placeholder="이메일" defaultValue={prefill.email} required />
        <input name="phone" type="tel" placeholder="전화번호" defaultValue={prefill.phone} required />
        <input name="homepageUrl" type="url" placeholder="홈페이지 (선택)" />
        <input name="smartStoreUrl" type="url" placeholder="스마트스토어 (선택)" />
        <input name="instagramUrl" type="url" placeholder="인스타그램 (선택)" />
        <input name="productName" placeholder="대표 제품명" required />
        <select name="productCategory" required defaultValue="">
          <option value="" disabled>
            제품 카테고리
          </option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div>
          <p>목표 국가 (복수 선택)</p>
          {TARGET_COUNTRIES.map((c) => (
            <label key={c}>
              <input type="checkbox" name="targetCountries" value={c} /> {c}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 준비도 체크리스트 */}
      <h2>수출 준비도 — 해당되는 것을 모두 체크하세요</h2>
      {CHECKLIST_GROUPS.map((g, i) => (
        <fieldset key={`${g.area}-${i}`}>
          <legend>{g.title}</legend>
          {g.note && <p style={{ fontSize: 13, color: "#6e6e73" }}>{g.note}</p>}
          {g.items.map((it) => (
            <label key={it.key} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input type="checkbox" name={it.key} value="1" />
              <span>{it.label}</span>
            </label>
          ))}
        </fieldset>
      ))}

      {/* 필수 동의 게이트 */}
      <div style={{ margin: "20px 0", padding: "13px 15px", background: "rgba(0,102,204,0.04)", borderRadius: 12 }}>
        <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontWeight: 600 }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          개인정보 수집 및 이용에 동의합니다. <span style={{ color: "#0066cc" }}>*</span>
        </label>
        <p style={{ fontSize: 12.5, color: "#6e6e73", marginTop: 8 }}>
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
        {error && <p style={{ color: "#d64545", fontWeight: 600, marginTop: 8 }}>{error}</p>}
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "진단 중..." : "수출 가능성 진단하기"}
      </button>
    </form>
  );
}
