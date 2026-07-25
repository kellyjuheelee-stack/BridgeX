// web/app/(public)/regulations/page.tsx — 유럽 규제 및 정보 허브
import Link from "next/link";
import HomeButton from "@/app/HomeButton";
import { REGULATIONS } from "./registry";
import ConsultCta from "./ConsultCta";
import styles from "./regulations.module.css";

export const metadata = {
  title: "유럽 규제 및 정보 — EU 수출 규제 대비 | BridgeX",
  description:
    "EU로 수출하는 K-뷰티 브랜드가 알아야 할 유럽 규제를 한곳에. PPWR(포장 규정) 2026.08.12 일반적용 등 화장품 업계 핵심 규제를 정리했습니다.",
};

export default function RegulationsHub() {
  return (
    <div className={styles.page}>
      <HomeButton />

      <section className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.eyebrow}>EU REGULATION</div>
          <h1 className={styles.heroTitle}>
            EU 수출 규제,
            <br />
            <span>미리 대비하세요.</span>
          </h1>
          <p className={styles.heroSub}>
            유럽 시장은 규제가 곧 진입장벽입니다. K-뷰티 브랜드가 반드시 알아야 할
            EU 규제를 화장품 관점에서 정리했습니다. 지금 바뀌는 규정을 확인하고,
            우리 브랜드의 대응 수준을 점검하세요.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.cardGrid}>
            {REGULATIONS.map((r) => {
              const live = r.status === "live";
              const inner = (
                <>
                  <div className={styles.regCardTop}>
                    <span className={styles.regCode}>{r.code}</span>
                    <span
                      className={`${styles.regTag} ${
                        live ? styles.regTagLive : styles.regTagSoon
                      }`}
                    >
                      {live ? "적용 임박" : "준비 중"}
                    </span>
                  </div>
                  <div className={styles.regName}>{r.name}</div>
                  <p className={styles.regDesc}>{r.desc}</p>
                  <div className={styles.regMetaRow}>
                    <span className="date" style={{ color: "var(--blue)" }}>
                      {r.keyDate}
                    </span>
                    <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                      · {r.keyDateLabel}
                    </span>
                  </div>
                  {live && (
                    <span className={styles.regMore}>자세히 보기 →</span>
                  )}
                </>
              );
              return live ? (
                <Link
                  key={r.slug}
                  href={`/regulations/${r.slug}`}
                  className={`${styles.regCard} ${styles.regCardActive}`}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={r.slug}
                  className={`${styles.regCard} ${styles.regCardSoon}`}
                  aria-disabled="true"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <ConsultCta />
        </div>
      </section>
    </div>
  );
}
