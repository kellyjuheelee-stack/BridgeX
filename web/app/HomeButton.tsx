// web/app/HomeButton.tsx
// 공개 페이지 공용 홈 버튼. 화면 좌상단 고정 플로팅 필. 인쇄 시 숨김.
import Link from "next/link";
import styles from "./HomeButton.module.css";

export default function HomeButton() {
  return (
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
      <span>홈</span>
    </Link>
  );
}
