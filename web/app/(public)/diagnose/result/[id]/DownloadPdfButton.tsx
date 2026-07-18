// web/app/(public)/diagnose/result/[id]/DownloadPdfButton.tsx
"use client";

import styles from "./result.module.css";

export default function DownloadPdfButton({ companyName }: { companyName: string }) {
  function handleDownload() {
    // 브라우저의 "PDF로 저장"이 문서 제목을 기본 파일명으로 사용한다.
    const prev = document.title;
    const safe = (companyName || "회사").replace(/[\\/:*?"<>|]/g, "").trim();
    document.title = `BridgeX_수출준비도진단_${safe}`;

    const restore = () => {
      document.title = prev;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);

    window.print();
  }

  return (
    <button type="button" className={styles.pdfBtn} onClick={handleDownload}>
      <svg viewBox="0 0 20 20" aria-hidden="true" width="17" height="17">
        <path
          d="M10 3v9m0 0l-3.2-3.2M10 12l3.2-3.2M4 14.5V16a1 1 0 001 1h10a1 1 0 001-1v-1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      PDF 다운로드
    </button>
  );
}
