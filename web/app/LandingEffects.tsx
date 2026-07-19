"use client";

// index.html 랜딩의 스크롤 연출을 progressive-enhancement 방식으로 복원.
// - [data-fade] 요소: 스크롤 진입 시 페이드업 (JS 없으면 그대로 보임)
// - #bx-nav: 스크롤 시 상단바 헤어라인/그림자
// - [data-goal-line]: 영상 캡션 글자별 순차 강조 (Web Animations API)
import { useEffect } from "react";

export default function LandingEffects() {
  useEffect(() => {
    // ── scroll fade-up ──
    const fades = Array.from(
      document.querySelectorAll<HTMLElement>("[data-fade]")
    );
    fades.forEach((el, i) => {
      const d = Math.min(i * 0.04, 0.24);
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition =
        `opacity .7s cubic-bezier(.22,.61,.36,1) ${d}s,` +
        ` transform .7s cubic-bezier(.22,.61,.36,1) ${d}s`;
    });
    const fadeIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const t = e.target as HTMLElement;
            t.style.opacity = "1";
            t.style.transform = "none";
            fadeIo.unobserve(t);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    fades.forEach((el) => fadeIo.observe(el));

    // ── nav hairline / shadow on scroll ──
    const nav = document.getElementById("bx-nav");
    const onScroll = () => {
      if (!nav) return;
      if (window.scrollY > 12) {
        nav.style.borderBottomColor = "rgba(0,0,0,0.09)";
        nav.style.boxShadow = "0 1px 16px rgba(0,0,0,0.05)";
      } else {
        nav.style.borderBottomColor = "rgba(0,0,0,0.06)";
        nav.style.boxShadow = "none";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // ── goal line: per-character sequential emphasis ──
    const line = document.querySelector<HTMLElement>("[data-goal-line]");
    let goalIo: IntersectionObserver | undefined;
    if (line) {
      const text = line.textContent ?? "";
      line.textContent = "";
      const spans: HTMLSpanElement[] = [];
      for (let i = 0; i < text.length; i++) {
        const s = document.createElement("span");
        s.textContent = text[i];
        s.style.display = "inline-block";
        s.style.whiteSpace = "pre";
        line.appendChild(s);
        spans.push(s);
      }
      const play = () => {
        spans.forEach((s, i) => {
          s.animate(
            [
              { opacity: 0, transform: "translateY(11px)", filter: "blur(6px)" },
              { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
            ],
            {
              // 더 긴 지속시간 + 넓은 간격 + 부드러운 감속 이징으로 천천히 스며들듯
              duration: 1050,
              delay: i * 95,
              easing: "cubic-bezier(.16,.84,.44,1)",
              fill: "backwards",
            }
          );
        });
      };
      goalIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) play();
          });
        },
        { threshold: 0.4 }
      );
      goalIo.observe(line);
    }

    return () => {
      fadeIo.disconnect();
      window.removeEventListener("scroll", onScroll);
      goalIo?.disconnect();
    };
  }, []);

  return null;
}
