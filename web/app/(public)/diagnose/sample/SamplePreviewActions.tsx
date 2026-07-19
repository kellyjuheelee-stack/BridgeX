// web/app/(public)/diagnose/sample/SamplePreviewActions.tsx
"use client";

import Link from "next/link";
import styles from "../result/[id]/result.module.css";

export default function SamplePreviewActions() {
  return (
    <div className={styles.pdfPreviewActions}>
      <Link href="/" className={styles.previewBtn}>
        홈
      </Link>
      <Link href="/diagnose" className={`${styles.previewBtn} ${styles.previewBtnPrimary}`}>
        내 브랜드로 진단하기 →
      </Link>
    </div>
  );
}
