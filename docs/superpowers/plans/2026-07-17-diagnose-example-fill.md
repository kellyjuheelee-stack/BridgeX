# 진단 폼 "예제입력" 버튼 구현 플랜

**작성:** 2026-07-17 (기획자 세션) · **대상:** 개발자 세션
**브랜치:** `feat/diagnose-form-redesign` 연장선 (또는 신규 `feat/diagnose-example-fill`)

---

## 1. 목적 / 요구사항

수출 준비도 진단 폼(`/diagnose`) **상단에 "예제입력" 버튼**을 추가한다.

- 버튼을 누르면 **미리 작성된 진단 데이터 세트**가 폼 전체(시작 정보 · 목표 국가 · 19개 체크리스트)에 자동 입력된다.
- 버튼을 **여러 번 누르면 미리 준비된 여러 세트 중 랜덤으로** 골라 채운다.
- 데모·영업 시연·QA 시 매번 손으로 입력하는 수고를 없애는 것이 목적.

### 동작 규칙 (합의된 기본값)
- 예제 세트는 **4개** 준비한다 (준비도 스펙트럼이 서로 다르게 — 아래 §3).
- 랜덤 선택 시 **직전에 나온 세트는 연속으로 다시 뽑지 않는다** (같은 화면이 반복되는 인상 방지).
- 버튼은 **폼 제출과 무관** (`type="button"`). 채우기만 하고 제출하지 않는다.
- 예제입력은 **모든 필드를 덮어쓴다** (기존 입력값 포함). 체크박스도 세트에 없는 항목은 명시적으로 해제한다.
- **개인정보 동의 체크박스(`consent` state)는 건드리지 않는다** — 동의는 사용자가 직접 하도록 남겨 게이트 의미를 유지한다. (제출은 여전히 동의 후에만 가능)

---

## 2. 변경 파일 (총 3개)

| 파일 | 변경 |
|---|---|
| `web/app/(public)/diagnose/exampleData.ts` | **신규** — 예제 데이터 세트 + 타입 |
| `web/app/(public)/diagnose/DiagnoseForm.tsx` | 버튼 + 채우기 로직 추가 |
| `web/app/(public)/diagnose/diagnose.module.css` | 버튼/헤더 스타일 추가 |

DB · 서버액션 · 엔진 변경 **없음**. 순수 클라이언트 UX 기능.

---

## 3. 신규 파일: `exampleData.ts`

체크리스트 키의 단일 출처인 `ChecklistKey` / 카테고리 / 국가 상수를 재사용한다.
`checks`는 `Partial` — **명시하지 않은 키는 false**로 취급(폼 채울 때 전부 해제 후 명시분만 체크).

```ts
// web/app/(public)/diagnose/exampleData.ts
// 진단 폼 "예제입력" 버튼용 시연 데이터. 준비도 스펙트럼을 다르게 구성.
import type { ChecklistKey } from "@/lib/constants/diagnosisChecklist";

export interface DiagnoseExample {
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  homepageUrl?: string;
  smartStoreUrl?: string;
  instagramUrl?: string;
  productName: string;
  productCategory: string;   // PRODUCT_CATEGORIES 중 하나와 정확히 일치
  targetCountries: string[]; // TARGET_COUNTRIES 값과 정확히 일치
  checks: Partial<Record<ChecklistKey, boolean>>; // 미기재 키 = 미체크
}

export const DIAGNOSE_EXAMPLES: DiagnoseExample[] = [ /* §3.1의 4개 세트 */ ];
```

### 3.1 예제 세트 4종 (개발자는 아래 값 그대로 입력)

> 4개 세트를 준비도 낮음→높음으로 구성해 결과 페이지의 레벨(준비 필요 / 부분 준비됨 / 준비됨)이 서로 다르게 나오도록 함.
> `productCategory`는 반드시 `["스킨케어","메이크업","헤어/바디","향수","더모코스메틱","기타"]` 중 하나,
> `targetCountries`는 `["독일","프랑스","이탈리아","스페인","폴란드","네덜란드","기타 EU"]` 중에서만.

**세트 A — 초기 브랜드 (준비 필요 예상)**
```
contactName: "김서연",  companyName: "글로우데이즈",
email: "seoyeon.kim@glowdays.co.kr", phone: "010-2345-6789",
smartStoreUrl: "https://smartstore.naver.com/glowdays",
instagramUrl: "https://instagram.com/glowdays.official",
productName: "히알루론 수분 앰플",  productCategory: "스킨케어",
targetCountries: ["독일","프랑스"],
checks: { sellingInKorea: true, hasSalesRecord: true }
// EU 요건·포장·영업자료·바이어 전부 미체크 → 준비 필요
```

**세트 B — 성장기 브랜드 (부분 준비됨 예상)**
```
contactName: "이준호",  companyName: "뷰티라운지",
email: "junho.lee@beautylounge.kr", phone: "010-3456-7890",
homepageUrl: "https://beautylounge.kr",
smartStoreUrl: "https://smartstore.naver.com/beautylounge",
productName: "시카 진정 크림",  productCategory: "더모코스메틱",
targetCountries: ["독일","프랑스","폴란드"],
checks: {
  sellingInKorea: true, hasSalesRecord: true, hasManufacturingCert: true,
  euRp: true, euCpnp: true, euInci: true,
  hasEnglishCatalog: true, hasExportExperience: true
}
// EU 3/7, 포장 0/4, 영업 일부, 바이어 접점 없음 → 부분 준비됨
```

**세트 C — 수출 경험 브랜드 (준비됨 근접)**
```
contactName: "박지민",  companyName: "온뷰티코스메틱",
email: "jimin.park@onbeauty.com", phone: "010-4567-8901",
homepageUrl: "https://onbeauty.com",
instagramUrl: "https://instagram.com/onbeauty.global",
productName: "레티놀 나이트 세럼",  productCategory: "스킨케어",
targetCountries: ["독일","프랑스","이탈리아","네덜란드"],
checks: {
  sellingInKorea: true, hasSalesRecord: true, hasManufacturingCert: true,
  euRp: true, euCpnp: true, euPif: true, euCpsr: true, euInci: true,
  euLabeling: true, euAllergen: true,
  pkgRecyclable: true, pkgDoc: true,
  hasEnglishCatalog: true, hasOfferSheet: true,
  hasBuyer: true, hasExportExperience: true, hasTradeFairExperience: true
}
// EU 7/7, 포장 2/4, 영업 완비, 바이어 접점 있음 → 준비됨
```

**세트 D — 메이크업 중견 (부분 준비됨, 축별 편차)**
```
contactName: "최유나",  companyName: "컬러팝서울",
email: "yuna.choi@colorpopseoul.kr", phone: "010-5678-9012",
homepageUrl: "https://colorpopseoul.kr",
smartStoreUrl: "https://smartstore.naver.com/colorpopseoul",
instagramUrl: "https://instagram.com/colorpop.seoul",
productName: "벨벳 매트 립틴트",  productCategory: "메이크업",
targetCountries: ["프랑스","스페인","기타 EU"],
checks: {
  sellingInKorea: true, hasSalesRecord: true, hasManufacturingCert: true,
  euRp: true, euLabeling: true, euAllergen: true,
  pkgRecyclable: true, pkgRecycledContent: true,
  hasEnglishCatalog: true, hasOfferSheet: true,
  hasBuyer: true
}
// EU 3/7, 포장 2/4, 영업 완비, 바이어 접점 있으나 수출/박람회 경험 없음
```

> 세트 값은 시연용이며 실제 회사와 무관한 가상 데이터. 이메일/전화/URL 모두 더미.

---

## 4. `DiagnoseForm.tsx` 변경

### 4.1 현재 구조 전제
- 폼은 **비제어(uncontrolled)** — `defaultValue` / 체크박스 기본 unchecked. → 마운트 후 `defaultValue` 재설정으로는 못 바꾼다.
- 따라서 **폼 DOM ref로 직접 값/체크 상태를 세팅**한다 (시연용 채우기라 DOM 조작이 가장 단순·안전).

### 4.2 추가 임포트 / ref
```tsx
import { useRef, useState } from "react";
import { CHECKLIST_GROUPS, /* 기존 */ } from "@/lib/constants/diagnosisChecklist";
import { DIAGNOSE_EXAMPLES } from "./exampleData";

const formRef = useRef<HTMLFormElement>(null);
const lastIdxRef = useRef(-1); // 직전 세트 인덱스(연속 중복 방지)
```
그리고 `<form action={handleSubmit} ...>` 에 `ref={formRef}` 부여.

### 4.3 채우기 함수
```tsx
// 모든 체크리스트 키(19개)를 단일 출처에서 도출 — 키 목록 중복 정의 금지
const ALL_CHECK_KEYS = CHECKLIST_GROUPS.flatMap((g) => g.items.map((i) => i.key));

function fillExample() {
  const form = formRef.current;
  if (!form) return;

  // 1) 직전과 다른 랜덤 인덱스
  let idx = Math.floor(Math.random() * DIAGNOSE_EXAMPLES.length);
  if (DIAGNOSE_EXAMPLES.length > 1) {
    while (idx === lastIdxRef.current) {
      idx = Math.floor(Math.random() * DIAGNOSE_EXAMPLES.length);
    }
  }
  lastIdxRef.current = idx;
  const ex = DIAGNOSE_EXAMPLES[idx];

  // 2) 텍스트/셀렉트 필드
  const setVal = (name: string, value: string) => {
    const el = form.elements.namedItem(name) as
      | HTMLInputElement | HTMLSelectElement | null;
    if (el && "value" in el) el.value = value;
  };
  setVal("contactName", ex.contactName);
  setVal("companyName", ex.companyName);
  setVal("email", ex.email);
  setVal("phone", ex.phone);
  setVal("homepageUrl", ex.homepageUrl ?? "");
  setVal("smartStoreUrl", ex.smartStoreUrl ?? "");
  setVal("instagramUrl", ex.instagramUrl ?? "");
  setVal("productName", ex.productName);
  setVal("productCategory", ex.productCategory);

  // 3) 목표 국가 (같은 name의 체크박스 그룹) — querySelectorAll로 직접
  form
    .querySelectorAll<HTMLInputElement>('input[name="targetCountries"]')
    .forEach((cb) => { cb.checked = ex.targetCountries.includes(cb.value); });

  // 4) 체크리스트 19개 — 세트에 없는 키는 false로 해제
  ALL_CHECK_KEYS.forEach((key) => {
    const cb = form.elements.namedItem(key) as HTMLInputElement | null;
    if (cb) cb.checked = !!ex.checks[key];
  });

  // 동의 체크박스는 의도적으로 건드리지 않음 (§1 규칙)
}
```

> **주의 (셀렉트):** `productCategory` `<select>`는 첫 옵션이 `value="" disabled`. 세트 값이 옵션 목록과 정확히 일치해야 반영됨 → §3.1 카테고리 표기를 상수와 100% 일치시킬 것.
>
> **주의 (제어 컴포넌트 아님):** 위 필드들은 비제어라서 DOM 직접 세팅으로 충분하고 리렌더 불필요. `optionCard`의 `:has(input:checked)` 하이라이트는 CSS라서 `checked` 변경 즉시 반영됨. 만약 향후 이 폼을 제어 컴포넌트로 바꾸면 이 함수도 state 세팅 방식으로 교체해야 함(리스크 메모).

### 4.4 버튼 배치
`h1.pageTitle`이 있는 헤더 영역을 제목 + 버튼의 가로 배치로 감싼다.

```tsx
<div className={styles.pageHead}>
  <h1 className={styles.pageTitle}>수출 준비도 진단</h1>
  <button type="button" className={styles.exampleBtn} onClick={fillExample}>
    예제입력
  </button>
</div>
<p className={styles.pageSub}>…기존 그대로…</p>
```
(기존 `<h1 className={styles.pageTitle}>…</h1>`를 위 블록으로 교체)

---

## 5. `diagnose.module.css` 추가

```css
/* 헤더: 제목 + 예제입력 버튼 가로 배치 */
.pageHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 6px;
}
.pageHead .pageTitle { margin: 0; }

/* 예제입력 = 보조 액션(고스트 필). 제출 blue pill과 위계 구분 */
.exampleBtn {
  flex: 0 0 auto;
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--blue);
  border-radius: 999px;
  background: #fff;
  color: var(--blue);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}
.exampleBtn:hover { background: rgba(0, 102, 204, 0.06); }
.exampleBtn:active { transform: scale(0.96); }

@media (max-width: 560px) {
  .pageHead { flex-wrap: wrap; }
}
```

---

## 6. 검증 체크리스트 (개발자 세션 완료 기준)

1. `/diagnose` 상단 우측에 "예제입력" 고스트 버튼이 보인다.
2. 버튼 클릭 시 시작 정보 8개 필드 + 카테고리 셀렉트 + 목표 국가 + 19개 체크리스트가 한 세트로 채워진다.
3. 목표 국가/체크리스트 카드의 **선택 하이라이트(파란 테두리)** 가 즉시 반영된다.
4. 버튼을 연속으로 5~6회 눌러도 **같은 세트가 연속으로 두 번 나오지 않는다.**
5. 버튼은 폼을 **제출하지 않는다** (`type="button"` 확인).
6. 동의 체크박스는 예제입력 후에도 **해제 상태 유지**, 동의 없이 제출 시 기존 에러 게이트가 정상 동작.
7. 예제입력 후 그대로 제출 → 결과 페이지가 세트별로 다른 준비도 레벨을 보여준다(A=준비 필요, C=준비됨 등).
8. `npm run build`(또는 lint/typecheck) 통과 — 특히 `checks[key]` 타입, `namedItem` 캐스팅.

---

## 7. 범위 밖 (하지 않음)
- 예제 데이터를 DB/서버에서 불러오기 — 이번엔 정적 배열로 충분.
- 프로덕션에서 버튼 숨김 처리(환경변수 게이팅) — 필요 시 후속. 현재는 항상 노출.
- 예제 세트 개수 확장/관리 UI — 후속.
```
