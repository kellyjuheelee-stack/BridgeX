# 카탈로그 컴플라이언스 진단 (모듈 2a) — 설계 문서

- 작성일: 2026-07-09
- 대상: BridgeX 회원 도구 — 카탈로그/마케팅 문구의 EU 시장 적합성 예비 점검
- 상태: 설계 확정. v1 = 저장 없는 즉석 점검 도구.
- 선행 문서: `2026-07-09-export-roadmap-design.md`(§3 모듈 2 개요)

---

## 0. 목적과 원칙

한국 화장품 카탈로그를 그대로 EU 바이어에게 보내면 문제 되는 표현이 많다. 회원이 문구를 붙여넣으면
**업계에서 자주 지적되는 표현을 짚어주고(교육 정보), 실제 판단은 전문가(컨설팅)로 넘긴다** — 원칙 A(가치 증명 + 벽).

**법적 리스크 회피(최우선 제약):**
- BridgeX는 **판정하지 않는다.** "금지/위반/불법" 같은 **단정 표현 절대 금지.**
- 톤은 **"업계에서 자주 지적됨 · 검토 권장"** 만. 일반 교육 정보로 위치.
- 모든 결과에 **면책 문구 상시 노출**(법률 자문 아님, 전문가 확인 필요).
- 애매·중요한 판단은 항상 전문가로 라우팅.

**엔진:** 규칙 기반(무료·즉시). 규칙은 `catalogAuditRules.js`에 분리 — 대표님이 문구만 수정 가능. Claude 교체는 나중.

**v1 범위:** 붙여넣기 → 스캔 → 결과 + 면책 + 벽 CTA. **저장/파일 업로드/자산 라이브러리는 제외**(fast-follow).

---

## 1. 회원 경험 흐름

1. 마이페이지 "AI 실무 도구" 또는 로드맵 `catalog_audit` 단계에서 **`catalog.html`** 진입.
2. 카탈로그의 **제품 설명·클레임 문구를 텍스트로 붙여넣기** → "점검하기".
3. 결과: ① **검토 권장 표현** 목록(표현·카테고리·왜·대안 힌트) ② **바이어레디 갭 체크**(INCI·인증·MOQ 등 있는지) ③ **종합** + **면책 문구** ④ **벽 CTA** "정확한 판단은 전문가와" → 컨설팅.
4. 저장 없음(즉석). 다시 점검하려면 문구 바꿔 재실행.

---

## 2. 스캔 규칙 (조사 기반, 부드러운 톤)

근거: EU 화장품규정 EC 1223/2009 + 클레임 공통기준 Reg 655/2013. **아래는 "자주 지적되는 표현" 참고 목록이며 법적 판정이 아님.**

7개 카테고리. 각 규칙 = { key, category(한글), terms(한/영 소문자 부분일치), why(비법률 설명), hint(대안 문구) }.

| key | category | 감지 예시 표현 | why(부드럽게) | 대안 힌트 |
|---|---|---|---|---|
| medicinal | 의약품·치료 뉘앙스 | 치료, 치유, 여드름 치료, 염증, 항염, 재생, 콜라겐 생성, 상처, cure, cures, heals, treats, treatment, anti-inflammatory, wound | 치료·의학 효능 뉘앙스는 화장품이 아닌 의약품으로 분류될 소지 → 자주 지적됨 | "관리에 도움", "결에 도움" 등 비의학적 표현으로 검토 |
| antibacterial | 항균·살균 | 항균, 살균, 멸균, 소독, antibacterial, antiseptic, disinfect, kills bacteria, 99.9% | 항균·살균(특히 수치) 주장은 biocide/의약품 경계로 자주 지적됨 | 세정·청결 관점 표현으로 검토 |
| freefrom | free-from·무첨가 | 무독성, 무첨가, 파라벤프리, paraben-free, chemical-free, toxin-free, non-toxic, "free from" | 합법 성분을 폄하하는 free-from 클레임은 불공정 소지로 자주 지적됨 | 넣은 것 중심(예: "OO 성분 함유")으로 검토 |
| unsupported | 근거 필요·과장 | 즉각, 즉시, 100%, 영구, 완벽, instant, permanent, guaranteed, clinically proven, 임상 입증, dermatologist recommended, 피부과 추천 | 근거 파일 없는 즉각·수치·임상 주장은 자주 지적됨 | 근거 확보 전엔 단정 표현 완화 검토 |
| hypoallergenic | 저자극·hypoallergenic | 저자극, 무자극, 알레르기 프리, hypoallergenic, allergen-free | 일부 EU 회원국은 강한 증빙을 요구하거나 표현 자체를 문제삼음 | 테스트 근거 명시 또는 표현 완화 검토 |
| compliance_benefit | 규제 준수를 강점처럼 | 동물실험 하지 않음, 동물실험 안 함, cruelty-free, not tested on animals | EU는 이미 동물실험 금지라, 차별점처럼 강조하면 오해 소지 | 필수 준수 사항은 강조점에서 분리 검토 |
| whitening | 미백·화이트닝 | 미백, 화이트닝, whitening, bleaching, skin lightening, 피부 미백 | "whitening/미백"은 의학·과장 뉘앙스로 자주 지적됨 | "brightening / even tone(톤 개선·광채)"로 검토 |

**스캔 방식:** 입력 텍스트를 소문자화 후 각 term을 부분일치(`includes`)로 검색. 카테고리별로 매칭된 표현을 dedupe해 모음. 매칭 없으면 해당 카테고리 제외.

**표기:** 각 발견은 중립 배지 **"검토 권장"** 만. 심각도 색/금지 표현 없음.

## 3. 바이어레디 갭 체크

입력 텍스트에 EU B2B 자료에 흔히 필요한 요소가 **보이는지** 힌트(있음/안 보임). 판정 아님.

| item | 감지 신호 | 안 보이면 note |
|---|---|---|
| INCI 전성분 | 'inci', '전성분' | INCI 전성분 표기가 바이어 검토에 필요할 수 있습니다 |
| 인증 | 'gmp','iso 22716','vegan','비건','cruelty','인증' | 보유 인증 명시가 신뢰에 도움이 됩니다 |
| MOQ·거래조건 | 'moq','incoterms','fob','cif','exw' | MOQ·Incoterms 등 거래조건이 바이어 문의를 줄여줍니다 |
| 영문 | 라틴문자 비율 낮음 | EU 바이어용 영문 자료가 필요할 수 있습니다 |

("있음"은 신호 기반 추정이며 정확성 보장 아님을 결과에 명시.)

## 4. 면책 문구 (결과에 상시 고정)

> 본 점검은 공개된 EU 화장품 가이드라인 기반 **일반 교육 정보**이며, **법률 자문이나 공식 규제 판단이 아닙니다.** 표시된 표현은 추가 검토가 필요할 수 있다는 제안일 뿐 법적 결론이 아니며, 최종 확정 전 반드시 전문 규제 컨설턴트와 상의하세요.

## 5. 백엔드

- 규칙: `backend/src/constants/catalogAuditRules.js` — `CLAIM_RULES[]`, `BUYER_READY_CHECKS[]`, `DISCLAIMER`, 순수 함수 `auditText(text) → { findings, buyerReady, summary, disclaimer }`.
  - `findings`: `[{ key, category, matched:string[], why, hint }]`
  - `buyerReady`: `[{ item, present:boolean, note }]`
  - `summary`: `{ flaggedCount, checkedChars }`
- 컨트롤러/라우트: `POST /api/members/me/catalog-audit` (requireMember), body `{ text }`. 응답 `{ success, data: { ...audit, diagnosisId } }` (diagnosisId = 회원 최신 진단 id 또는 null → 프론트 벽 CTA용).
  - 입력 검증: text 없거나 공백 → 400. 길이 상한(예: 20000자) 초과 시 잘라서 스캔.

## 6. 프론트 (`catalog.html`)

- email.html과 동일 구조/네비/토큰 처리. 로그인 필요(비로그인 → index.html).
- 상단 설명 + **면책 안내(입력 전에도 1줄 노출)**.
- 큰 textarea(붙여넣기) + "점검하기" 버튼.
- 결과: 검토 권장 표현 카드 목록(카테고리·매칭 표현·why·대안 힌트) + 바이어레디 체크 + 종합 문장 + **면책 박스** + **벽 CTA**.
  - 벽 CTA: `diagnosisId` 있으면 → `POST /api/export-diagnosis/:id/request-consultation` (stepContext='카탈로그 컴플라이언스 검토') 후 접수 안내. 없으면 → "먼저 진단받기"(`diagnose.html`) 링크.
- 매칭 0건이면: "눈에 띄는 위험 표현은 없었습니다. 다만 이는 예비 점검이며, 정확한 판단은 전문가 확인이 필요합니다." + 벽 CTA 유지.

## 7. 연결

- 로드맵 `roadmap.service.js`의 `catalog_audit` 단계: `link` 를 `{ type:'soon' }` → `{ type:'tool', href:'catalog.html' }` 로 변경. (`catalog_generate`(생성기, 2b)는 'soon' 유지.)
- `mypage.html` "AI 실무 도구" 카드에 **"🧴 카탈로그 EU 점검"** 버튼 추가(→ catalog.html).

## 8. v1 제외(다음)

- 결과/파일 저장·자산 라이브러리, PDF 파싱 업로드, Claude 심화 설명, 2b 카탈로그 생성기.

## 9. 결정 로그

1. 2b보다 2a(무료·저비용·벽) 먼저.
2. 입력 = 텍스트 붙여넣기 스캔(파일 파싱 X).
3. 법적 리스크 회피 = 단정 금지·"검토 권장" 톤·면책 상시·판단 전문가 이관.
4. v1 = 저장 없는 즉석 도구.
