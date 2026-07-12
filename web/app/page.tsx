// web/app/page.tsx — 랜딩 (index.html 포팅)
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import styles from "./landing.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BridgeX — 화장품 해외 수출, 이제 BridgeX가 끝냅니다.",
  description:
    "AI가 실행을, 전문가가 협상을. 예산 없는 1인 K뷰티 브랜드가 3개월 안에 첫 계약 테이블에 앉게 하는 Human+AI 하이브리드 수출 대행 플랫폼.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className={styles.page} id="top">
      {/* NAV */}
      <nav className={styles.nav}>
        <a href="#top" className={styles.navLogo}>
          Bridge<span>X</span>
        </a>
        <div className={styles.navActions}>
          {user ? (
            <>
              <a href="/mypage" className={styles.navCta}>
                내 페이지
              </a>
              <form action={signOut}>
                <button type="submit" className={styles.navLinkBtn}>
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <a href="/login" className={styles.navLinkBtn}>
                로그인
              </a>
              <a href="/signup" className={styles.navCta}>
                회원가입
              </a>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <header className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.dot}></span> AI + Human 하이브리드 수출 대행
        </div>
        <h1>
          화장품 해외 수출,
          <br />
          이제 <span>BridgeX</span>가 끝냅니다.
        </h1>
        <p className={styles.heroSub}>대표님은 제품에만 집중하십시오.</p>
        <div className={styles.heroCtaRow}>
          <a href="/diagnose" className={styles.btnLg}>
            우리 브랜드 수출 가능성 진단하기 →
          </a>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNum}>3개월</div>
            <div className={styles.statLabel}>첫 계약 테이블까지</div>
          </div>
          <div className={styles.statDiv}></div>
          <div className={styles.stat}>
            <div className={styles.statNum}>30분</div>
            <div className={styles.statLabel}>무료 상담 한 번이면 시작</div>
          </div>
          <div className={styles.statDiv}></div>
          <div className={styles.stat}>
            <div className={styles.statNum}>100%</div>
            <div className={styles.statLabel}>K뷰티 수출 특화</div>
          </div>
        </div>
      </header>

      {/* PROBLEM */}
      <section className={`${styles.section} ${styles.alt}`}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={`${styles.eyebrow} ${styles.eyebrowGray}`}>THE PROBLEM</div>
            <h2 className={styles.secTitle}>
              바이어를 만나도
              <br />
              계약까지 못 가는 이유
            </h2>
          </div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            <div className={`${styles.card} ${styles.lift}`}>
              <div className={styles.painIco}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
                  <path d="m3 6 9 7 9-7" />
                </svg>
              </div>
              <h3>답장이 오지 않는다</h3>
              <p>
                이메일 10통, 긍정 답변 0건.
                <br />
                번역은 되는데 바이어가 안 움직입니다.
              </p>
            </div>
            <div className={`${styles.card} ${styles.lift}`}>
              <div className={styles.painIco}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
                </svg>
              </div>
              <h3>답이 와도 막막하다</h3>
              <p>후속 대응·협상 노하우가 없어 대화가 계약으로 이어지지 않습니다.</p>
            </div>
            <div className={`${styles.card} ${styles.lift}`}>
              <div className={styles.painIco}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v10M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1.1 2-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2" />
                </svg>
              </div>
              <h3>컨설팅은 너무 비싸다</h3>
              <p>예산 없는 1인 브랜드가 감당할 실행 파트너가 없습니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.section} id="how">
        <div className={styles.wrap}>
          <div className={styles.secHead} style={{ marginBottom: 24 }}>
            <div className={`${styles.eyebrow} ${styles.eyebrowBlue}`}>HOW IT WORKS</div>
            <h2 className={styles.secTitle}>AI가 실행을, 전문가가 협상을.</h2>
          </div>
          <div className={styles.howLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendSw} style={{ background: "#0071e3" }}></span>AI 자동화
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendSw} style={{ background: "#1d1d1f" }}></span>전문가 직접 개입
            </div>
          </div>
          <div className={`${styles.grid} ${styles.grid6}`}>
            {[
              { n: "STEP 1", human: true, t: "바이어 발굴", d: "국가별 바이어 DB 자동 매칭." },
              { n: "STEP 2", human: false, t: "시장·규제 진단", d: "EU 화장품 규제(CPNP) 자동 체크." },
              { n: "STEP 3", human: false, t: "콜드 이메일 작성", d: "바이어가 반응하는 제안서 직접 작성." },
              { n: "STEP 4", human: false, t: "응답·후속 대응", d: "답장 대응 스크립트 실시간 생성." },
              { n: "STEP 5", human: true, t: "협상 전략", d: "가격·조건 협상을 동석해 리드." },
              { n: "STEP 6", human: true, t: "계약 테이블", d: "첫 계약까지 실무를 마무리." },
            ].map((s) => (
              <div key={s.n} className={`${styles.card} ${styles.step} ${styles.lift}`}>
                <div className={styles.stepTop}>
                  <span className={styles.stepN}>{s.n}</span>
                  <span className={`${styles.tag} ${s.human ? styles.tagHuman : styles.tagAi}`}>
                    {s.human ? "전문가 개입" : "AI 자동화"}
                  </span>
                </div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className={`${styles.section} ${styles.alt}`}>
        <div className={styles.cmpWrap}>
          <div className={styles.secHead} style={{ marginBottom: 48 }}>
            <div className={`${styles.eyebrow} ${styles.eyebrowBlue}`}>COMPARISON</div>
            <h2 className={styles.secTitle}>지금 혼자 할 때 vs BridgeX</h2>
          </div>
          <div className={styles.cmp}>
            <div className={`${styles.cmpRow} ${styles.cmpHead}`}>
              <div className={styles.cLabel}></div>
              <div className={styles.cSolo}>혼자 할 때</div>
              <div className={styles.cBx}>BridgeX와 함께</div>
            </div>
            {[
              ["바이어 찾기", "지인 소개·박람회 명함", "검증된 바이어 데이터베이스"],
              ["이메일", "한글→AI 번역 콜드메일", "맞춤형 이메일 템플릿"],
              ["규제 대응", "무엇을 볼지 모름", "EU CPNP 규제 자동 진단"],
              ["답장이 오면", "어떻게 답할지 막막", "실시간 대응 스크립트"],
              ["협상", "혼자 감당", "글로벌 실무 전문가 조언"],
              ["비용", "고액 컨설팅비 부담", "소규모 맞춤 실행형"],
            ].map(([label, solo, bx]) => (
              <div key={label} className={styles.cmpRow}>
                <div className={styles.cLabel}>{label}</div>
                <div className={styles.cSolo}>{solo}</div>
                <div className={styles.cBx}>{bx}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className={styles.section}>
        <div className={styles.baWrap}>
          <div className={styles.secHead} style={{ marginBottom: 48 }}>
            <div className={`${styles.eyebrow} ${styles.eyebrowBlue}`}>BEFORE / AFTER</div>
            <h2 className={styles.secTitle}>3개월 전과 후</h2>
          </div>
          <div className={styles.baRow}>
            <div className={`${styles.baCard} ${styles.baBefore}`}>
              <div className={styles.baLabel}>지금 · 혼자</div>
              <div className={styles.baList}>
                {["이메일 10통 → 답변 0건", "유럽 바이어 접점 0", "혼자 다 하다 지침"].map((t) => (
                  <div key={t} className={styles.baItem}>
                    <span className={styles.baMark}>✕</span>
                    <span className={styles.txt}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.baArrow}>→</div>
            <div className={`${styles.baCard} ${styles.baAfter}`}>
              <div className={styles.baLabel}>3개월 후 · BridgeX와</div>
              <div className={styles.baList}>
                {["바이어에게서 답장이 온다", "첫 계약 테이블에 앉는다", "제품 개발에만 집중한다"].map((t) => (
                  <div key={t} className={styles.baItem}>
                    <span className={styles.baMark}>✓</span>
                    <span className={styles.txt}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className={`${styles.section} ${styles.alt}`}>
        <div className={styles.wrap}>
          <div className={styles.secHead}>
            <div className={`${styles.eyebrow} ${styles.eyebrowBlue}`}>OUR PRINCIPLES</div>
            <h2 className={styles.secTitle}>타협하지 않는 3원칙</h2>
          </div>
          <div className={`${styles.grid} ${styles.grid6}`}>
            {[
              { n: "01", t: "실행 가능성", p: "지금 바로 보낼 이메일 한 통.", proof: "즉시 쓰는 실무 산출물" },
              { n: "02", t: "소규모 접근성", p: "1인 브랜드도 가능한 실행형 구조.", proof: "고액 컨설팅비 없이 시작" },
              { n: "03", t: "K뷰티 특화 깊이", p: "화장품 규제와 바이어만 깊게 팝니다.", proof: "EU CPNP·현지 유통 전문" },
            ].map((v) => (
              <div key={v.n} className={`${styles.card} ${styles.val} ${styles.lift}`}>
                <div className={styles.valN}>{v.n}</div>
                <h3>{v.t}</h3>
                <p>{v.p}</p>
                <div className={styles.valProof}>
                  <span className={styles.proofTag}>증명</span>
                  <span className={styles.proofTxt}>{v.proof}</span>
                </div>
              </div>
            ))}
          </div>

          {/* deal video banner */}
          <div className={styles.dealVideo}>
            <video
              src="/assets/handshake-deal.mp4"
              poster="/assets/handshake-deal-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className={styles.dealOverlay}>
              <div className={styles.dealCap}>
                <div className={styles.dealCapEyebrow}>The Goal</div>
                <h3>우리의 목표는 하나입니다.</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.section} id="cta">
        <div className={styles.ctaCard}>
          <h2>
            해외 수출, 이제 혼자
            <br />
            고민하지 마세요.
          </h2>
          <div className={styles.ctaForm}>
            <a href="/diagnose" className={styles.btnLg}>
              우리 브랜드 수출 가능성 진단하기
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footIn}>
          <div className={styles.footLogo}>
            Bridge<span>X</span>
          </div>
          <div className={styles.footCopy}>© 2026 BridgeX. K뷰티 수출의 모든 실행을 대신합니다.</div>
        </div>
      </footer>
    </div>
  );
}
