// web/app/(public)/regulations/ppwr/page.tsx — PPWR 상세페이지
import Link from "next/link";
import HomeButton from "@/app/HomeButton";
import styles from "../regulations.module.css";
import {
  PPWR_META,
  PPWR_STATS,
  PPWR_TIMELINE,
  PPWR_ARTICLES,
  PPWR_ROLES,
  PPWR_CHECKLIST,
  PPWR_SOURCES,
} from "./content";

export const metadata = {
  title: "PPWR: EU 포장 및 포장 폐기물 규정 — 화장품 업계 가이드 | BridgeX",
  description:
    "EU PPWR(Regulation 2025/40)이 K-뷰티 화장품 포장에 미치는 영향. 2026.08.12 일반적용 개시. 재활용 설계·재생원료 의무·유해물질·호텔 어메니티 금지 등 조항별 화장품 실무 영향을 정리했습니다.",
};

export default function PpwrPage() {
  return (
    <div className={styles.page}>
      <HomeButton />

      {/* 히어로 */}
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <Link href="/regulations" className={styles.backLink}>
            ← 유럽 규제 및 정보
          </Link>
          <div className={styles.eyebrow}>PPWR · {PPWR_META.regNo}</div>
          <h1 className={styles.heroTitle}>
            EU 포장 및 포장 폐기물 규정
            <br />
            <span>화장품 업계는 무엇이 바뀌나</span>
          </h1>
          <p className={styles.heroSub}>
            PPWR(Packaging and Packaging Waste Regulation)은 EU로 수출되는 모든
            포장에 적용되는 통합 규정입니다. 화장품 용기·펌프·단상자·배송 박스까지
            재활용 설계, 재생원료, 유해물질, 라벨링 의무가 단계적으로 부과됩니다.
          </p>
          <div className={styles.ddayRow}>
            <span className={styles.dday}>
              일반적용 개시 <b>{PPWR_META.generalApplication}</b>
            </span>
            <a
              className={styles.sourcePill}
              href={PPWR_META.eurLexUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              규정 원문 (EUR-Lex) ↗
            </a>
          </div>
        </div>
      </section>

      {/* TL;DR 스탯 */}
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.eyebrow}>한눈에 보기</div>
          <h2 className={styles.secTitle}>핵심 요약</h2>
          <div className={styles.statGrid}>
            {PPWR_STATS.map((s) => (
              <div key={s.label} className={styles.statCard}>
                <div className={styles.statNum}>{s.num}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
          <p className={styles.secSub} style={{ marginTop: 24 }}>
            {PPWR_META.regNo}은 회원국별로 다르던 기존 포장지침(94/62/EC)을 EU
            차원의 단일 <b>규정(Regulation)</b>으로 통합·강화한 것으로, 전 회원국에
            동일하게 적용됩니다. 발효는 {PPWR_META.entryIntoForce}, 일반적용은{" "}
            {PPWR_META.generalApplication}부터입니다.
          </p>
        </div>
      </section>

      {/* 타임라인 */}
      <section className={`${styles.section}`} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={styles.eyebrow}>Timeline</div>
          <h2 className={styles.secTitle}>단계별 적용 일정</h2>
          <div className={styles.timeline}>
            {PPWR_TIMELINE.map((t) => (
              <div
                key={t.date}
                className={`${styles.tlItem} ${t.key ? styles.tlKey : ""}`}
              >
                <div className={styles.tlDate}>{t.date}</div>
                <div className={styles.tlBody}>{t.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 조항별 + 화장품 적용 */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={styles.eyebrow}>핵심 조항</div>
          <h2 className={styles.secTitle}>조항별 내용과 화장품 영향</h2>
          <div className={styles.articleList}>
            {PPWR_ARTICLES.map((a) => (
              <div key={a.no} className={styles.article}>
                <div className={styles.articleHead}>
                  <span className={styles.articleNo}>{a.no}</span>
                  <span className={styles.articleTitle}>{a.title}</span>
                </div>
                {a.body.map((p, i) => (
                  <p key={i} className={styles.articleBody}>
                    {p}
                  </p>
                ))}
                {a.bullets && (
                  <div className={styles.articleBody}>
                    <ul>
                      {a.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className={styles.cosmeticBox}>
                  <span className={styles.cosmeticLabel}>💄 화장품 적용</span>
                  <p className={styles.cosmeticBody}>{a.cosmetic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 경제운영자 지위 */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={styles.eyebrow}>For K-Beauty</div>
          <h2 className={styles.secTitle}>한국 브랜드의 지위와 의무</h2>
          <p className={styles.secSub}>
            한국 브랜드는 EU 관점에서 '제3국 제조업체'입니다. 포장에 표기된 상표를
            기준으로 책임 주체가 결정됩니다.
          </p>
          <div className={styles.statusCard}>
            {PPWR_ROLES.map((r) => (
              <div key={r.role} className={styles.statusRow}>
                <div className={styles.statusRole}>{r.role}</div>
                <div className={styles.statusText}>{r.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 대응 체크리스트 */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={styles.eyebrow}>Action Plan</div>
          <h2 className={styles.secTitle}>지금 준비할 4가지</h2>
          <div className={styles.checkList}>
            {PPWR_CHECKLIST.map((c, i) => (
              <div key={c.title} className={styles.checkItem}>
                <div className={styles.checkNum}>{i + 1}</div>
                <div className={styles.checkTitle}>{c.title}</div>
                <div className={styles.checkDesc}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={styles.ctaBand}>
            <h2>PPWR 대응, 어디서부터 시작해야 할까요?</h2>
            <p>
              우리 브랜드의 EU 수출 준비도와 규제 대응 수준을 30분 무료 진단으로
              확인하세요. 포장 규제를 포함한 실행 로드맵을 제안드립니다.
            </p>
            <Link href="/diagnose" className={styles.ctaBtn}>
              무료 수출 준비도 진단하기 →
            </Link>
          </div>
        </div>
      </section>

      {/* 출처·면책 */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={styles.sources}>
            <div className={styles.sourcesTitle}>출처</div>
            {PPWR_SOURCES.map((s) => (
              <div key={s.label} className={styles.sourceItem}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label} ↗
                  </a>
                ) : (
                  s.label
                )}
              </div>
            ))}
            <p className={styles.disclaimer}>
              본 자료는 이해를 돕기 위한 일반 정보이며 법률 자문이 아닙니다. PPWR의
              세부 요건은 위임법·시행법 채택을 통해 구체화되므로, 실제 대응 시 최신
              규정 원문과 전문가 자문을 확인하시기 바랍니다. 최종 업데이트:
              2026.07.25.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
