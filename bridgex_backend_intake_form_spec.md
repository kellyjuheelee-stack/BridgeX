# BridgeX 백엔드 개발 지시서: 수출 가능성 진단 Intake Form

## 1. 목적

BridgeX 웹서비스에서 사용자가 **“우리 브랜드 수출 가능성 진단하기”** 버튼을 클릭하면, 3단계 인테이크 폼을 작성하고 마지막 4단계에서 **진단 버튼**을 눌러 수출 준비도 진단을 요청할 수 있도록 백엔드를 구현한다.

이 기능의 목적은 단순 상담 신청이 아니라, 화장품 브랜드의 유럽 수출 준비 상태를 구조화된 데이터로 수집하고, 이후 AI 진단/컨설팅/세일즈 전환에 활용할 수 있는 기반 데이터를 만드는 것이다.

---

## 2. 전체 사용자 흐름

```text
랜딩페이지 CTA 클릭
→ Step 1. 기본 정보 입력
→ Step 2. 제품 정보 입력
→ Step 3. 수출 목표 및 현재 상태 입력
→ Step 4. 진단 버튼 클릭
→ 제출 완료 / 진단 결과 생성 대기 / 관리자 확인 가능
```

CTA 버튼명:

```text
우리 브랜드 수출 가능성 진단하기
```

제출 버튼명:

```text
수출 가능성 진단하기
```

제출 완료 메시지:

```text
수출 가능성 진단 요청이 접수되었습니다.
입력하신 이메일로 진단 결과와 다음 단계를 안내드리겠습니다.
```

---

## 3. 기능 범위

### 3.1 MVP에서 구현할 것

- 3단계 인테이크 폼 데이터 저장
- 필수 항목 검증
- 파일 업로드 필드 준비
- 제출 완료 상태 저장
- 관리자/백오피스에서 제출 데이터 확인 가능하도록 API 제공
- 제출 시 진단 요청 상태값 생성
- 향후 AI 진단과 연결할 수 있도록 데이터 구조 설계

### 3.2 MVP에서 가짜 처리해도 되는 것

- 실제 AI 진단 결과 생성
- 실제 이메일 발송
- 실제 PDF 분석
- 실제 EU 규제 DB 매칭

단, 백엔드 구조는 향후 AI 진단, 이메일 발송, PDF 분석, 규제 DB 매칭이 연결될 수 있도록 설계한다.

---

## 4. 데이터 모델 설계

메인 엔티티명:

```text
ExportDiagnosisRequest
```

또는 DB 테이블명:

```text
export_diagnosis_requests
```

---

## 5. Step 1. 기본 정보

### 목적

고객 식별, 상담 전환, 진단 결과 안내를 위한 기본 정보를 수집한다.

### 필드 정의

| 필드명 | 영문 Key | 타입 | 필수 여부 | 설명 |
|---|---|---:|---:|---|
| 담당자명 | contactName | string | 필수 | 상담/결과 안내용 |
| 회사명 | companyName | string | 필수 | 브랜드 확인 |
| 직책 | position | string | 선택 | 대표인지 실무자인지 구분 |
| 이메일 주소 | email | string | 필수 | 진단 결과 발송 |
| 전화번호 | phone | string | 필수 | 상담 전환용 |
| 회사 홈페이지 / 스마트스토어 / 인스타그램 | brandUrl | string | 선택 | 브랜드 상태 확인 |
| 회사 매출 규모 | annualRevenueRange | enum/string | 선택 | 유료 전환 가능성 판단 |

### 회사 매출 규모 옵션 예시

```text
- 1억 미만
- 1억 ~ 5억
- 5억 ~ 10억
- 10억 ~ 30억
- 30억 ~ 50억
- 50억 이상
- 공개하고 싶지 않음
```

---

## 6. Step 2. 제품 정보

### 목적

진단 대상 제품을 특정하고, EU 규제 검토 및 바이어 설득 가능성을 판단하기 위한 제품 정보를 수집한다.

### 필드 정의

| 필드명 | 영문 Key | 타입 | 필수 여부 | 설명 |
|---|---|---:|---:|---|
| 대표 제품명 | productName | string | 필수 | 진단 대상 설정 |
| 제품 카테고리 | productCategory | enum/string | 필수 | 스킨케어, 바디케어, 헤어케어 등 |
| 제품 사진 또는 카탈로그 업로드 | productFiles | file[] | 선택 | AI 카탈로그 생성 연결 |
| 주요 성분 / INCI 보유 여부 | hasInci | boolean/enum | 필수 | EU 규제 검토와 연결 |
| 용량 / 가격대 | volumeAndPriceRange | string | 선택 | Price-Value 판단 |
| 국내 판매 여부 | isSellingInKorea | boolean/enum | 필수 | 시장 검증 여부 |
| 월 판매량 또는 베스트셀러 여부 | monthlySalesOrBestSeller | string | 선택 | 바이어 설득 포인트 |
| 인증 보유 여부 | certifications | string[]/enum[] | 필수 | CGMP, ISO, 비건, EWG, 임상 등 |

### 제품 카테고리 옵션 예시

```text
- 스킨케어
- 바디케어
- 헤어케어
- 클렌징
- 선케어
- 메이크업
- 향수/프래그런스
- 기타
```

### 주요 성분 / INCI 보유 여부 옵션

```text
- INCI 리스트 보유
- 일부 보유
- 보유하지 않음
- 잘 모르겠음
```

### 국내 판매 여부 옵션

```text
- 판매 중
- 출시 예정
- 테스트 판매 중
- 아직 판매 전
```

### 인증 보유 여부 옵션 예시

복수 선택 가능하게 구현한다.

```text
- CGMP
- ISO 22716
- 비건 인증
- EWG
- 피부 임상
- 저자극 테스트
- 기능성 인증
- 특허/상표
- 없음
- 잘 모르겠음
- 기타
```

---

## 7. Step 3. 수출 목표 및 현재 상태

### 목적

목표 시장, 유통 채널, 수출 경험, 바이어 접촉 여부, 현재 가장 어려운 부분을 파악하여 진단 결과와 컨설팅 니즈를 분류한다.

### 필드 정의

| 필드명 | 영문 Key | 타입 | 필수 여부 | 설명 |
|---|---|---:|---:|---|
| 목표 국가 | targetCountries | string[]/enum[] | 필수 | Europe First: France, Germany, Italy, Spain 등 |
| 희망 유통 채널 | preferredChannels | string[]/enum[] | 선택 | 편집숍, 약국, 온라인몰, 유통사, B2B 바이어 |
| 해외 수출 경험 | exportExperience | enum | 필수 | 초보/경험자 구분 |
| 박람회 참가 경험 | tradeFairExperience | enum/string | 선택 | Follow-up 기능 연결 |
| 현재 만난 바이어가 있는지 | hasExistingBuyer | boolean/enum | 필수 | 바이어 관리/계약 전환 단계 연결 |
| 가장 어려운 부분 | painPoints | string[]/enum[] | 필수 | 컨설팅 니즈 파악 |

### 목표 국가 옵션

우선 유럽 국가 중심으로 시작한다.

```text
- France
- Germany
- Italy
- Spain
- Netherlands
- Belgium
- Poland
- Sweden
- United Kingdom
- 기타 유럽 국가
- 아직 정하지 못함
```

### 희망 유통 채널 옵션

복수 선택 가능하게 구현한다.

```text
- 편집숍
- 약국/더마코스메틱 채널
- 온라인몰
- 유통사/디스트리뷰터
- B2B 바이어
- 아마존/마켓플레이스
- 살롱/스파/전문점
- 아직 정하지 못함
```

### 해외 수출 경험 옵션

```text
- 없음
- 샘플 발송 경험 있음
- 바이어 미팅 경험 있음
- 수출 계약 경험 있음
- 현재 수출 중
```

### 박람회 참가 경험 옵션

```text
- 참가 경험 없음
- 국내 박람회 참가 경험 있음
- 해외 박람회 참가 경험 있음
- 참가 예정
- 박람회에서 바이어를 만난 적 있음
```

### 현재 만난 바이어가 있는지 옵션

```text
- 있음
- 없음
- 대화 중인 바이어는 있으나 진행이 멈춤
- 잘 모르겠음
```

### 가장 어려운 부분 옵션

복수 선택 가능하게 구현한다.

```text
- 어떤 국가부터 시작해야 할지 모르겠어요
- 유럽 규제/허가가 어렵습니다
- 영문 회사소개서/카탈로그가 없습니다
- 박람회 이후 바이어 Follow-up이 안 됩니다
- 가격표, MOQ, Incoterms 설정이 어렵습니다
- 바이어와 이메일/미팅/협상이 어렵습니다
- 계약 직전 검토가 필요합니다
```

---

## 8. Step 4. 진단 버튼

### 목적

Step 1~3에서 입력한 데이터를 최종 제출하고, 진단 요청 상태를 생성한다.

### 버튼명

```text
수출 가능성 진단하기
```

또는

```text
내 브랜드 수출 가능성 진단하기
```

### 클릭 시 처리

1. 필수 항목 검증
2. 입력 데이터 저장
3. 파일 업로드가 있는 경우 파일 경로 저장
4. `diagnosisStatus` 값을 `submitted`로 저장
5. `submittedAt` timestamp 저장
6. 사용자에게 완료 메시지 표시
7. 관리자용 리스트에서 확인 가능하도록 저장

### 진단 상태값

```text
submitted        // 제출 완료
reviewing        // 검토 중
ai_generated     // AI 진단 초안 생성 완료
consulting_needed // 컨설팅 필요
completed        // 진단 완료
archived         // 보관/종료
```

---

## 9. API 설계

### 9.1 진단 요청 생성

```http
POST /api/export-diagnosis
```

#### Request Body 예시

```json
{
  "contactName": "홍길동",
  "companyName": "뷰티코스메틱",
  "position": "대표",
  "email": "hello@beautycosmetic.com",
  "phone": "010-1234-5678",
  "brandUrl": "https://instagram.com/beautycosmetic",
  "annualRevenueRange": "5억 ~ 10억",
  "productName": "Barrier Repair Cream",
  "productCategory": "스킨케어",
  "hasInci": "INCI 리스트 보유",
  "volumeAndPriceRange": "50ml / 소비자가 32,000원",
  "isSellingInKorea": "판매 중",
  "monthlySalesOrBestSeller": "월 3,000개 판매 / 베스트셀러",
  "certifications": ["ISO 22716", "저자극 테스트", "비건 인증"],
  "targetCountries": ["France", "Germany"],
  "preferredChannels": ["약국/더마코스메틱 채널", "유통사/디스트리뷰터"],
  "exportExperience": "바이어 미팅 경험 있음",
  "tradeFairExperience": "해외 박람회 참가 경험 있음",
  "hasExistingBuyer": "대화 중인 바이어는 있으나 진행이 멈춤",
  "painPoints": [
    "유럽 규제/허가가 어렵습니다",
    "박람회 이후 바이어 Follow-up이 안 됩니다",
    "가격표, MOQ, Incoterms 설정이 어렵습니다"
  ]
}
```

#### Response 예시

```json
{
  "success": true,
  "message": "수출 가능성 진단 요청이 접수되었습니다.",
  "data": {
    "id": "diag_001",
    "diagnosisStatus": "submitted",
    "submittedAt": "2026-07-06T10:00:00.000Z"
  }
}
```

---

### 9.2 진단 요청 목록 조회: 관리자용

```http
GET /api/export-diagnosis
```

#### Query Parameters

```text
status=submitted
country=France
companyName=뷰티
page=1
limit=20
```

#### Response 예시

```json
{
  "success": true,
  "data": [
    {
      "id": "diag_001",
      "companyName": "뷰티코스메틱",
      "contactName": "홍길동",
      "email": "hello@beautycosmetic.com",
      "phone": "010-1234-5678",
      "productName": "Barrier Repair Cream",
      "targetCountries": ["France", "Germany"],
      "diagnosisStatus": "submitted",
      "submittedAt": "2026-07-06T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

### 9.3 진단 요청 상세 조회

```http
GET /api/export-diagnosis/:id
```

#### Response 예시

```json
{
  "success": true,
  "data": {
    "id": "diag_001",
    "contactName": "홍길동",
    "companyName": "뷰티코스메틱",
    "position": "대표",
    "email": "hello@beautycosmetic.com",
    "phone": "010-1234-5678",
    "brandUrl": "https://instagram.com/beautycosmetic",
    "annualRevenueRange": "5억 ~ 10억",
    "productName": "Barrier Repair Cream",
    "productCategory": "스킨케어",
    "hasInci": "INCI 리스트 보유",
    "volumeAndPriceRange": "50ml / 소비자가 32,000원",
    "isSellingInKorea": "판매 중",
    "monthlySalesOrBestSeller": "월 3,000개 판매 / 베스트셀러",
    "certifications": ["ISO 22716", "저자극 테스트", "비건 인증"],
    "targetCountries": ["France", "Germany"],
    "preferredChannels": ["약국/더마코스메틱 채널", "유통사/디스트리뷰터"],
    "exportExperience": "바이어 미팅 경험 있음",
    "tradeFairExperience": "해외 박람회 참가 경험 있음",
    "hasExistingBuyer": "대화 중인 바이어는 있으나 진행이 멈춤",
    "painPoints": [
      "유럽 규제/허가가 어렵습니다",
      "박람회 이후 바이어 Follow-up이 안 됩니다",
      "가격표, MOQ, Incoterms 설정이 어렵습니다"
    ],
    "diagnosisStatus": "submitted",
    "submittedAt": "2026-07-06T10:00:00.000Z"
  }
}
```

---

### 9.4 진단 상태 업데이트: 관리자용

```http
PATCH /api/export-diagnosis/:id/status
```

#### Request Body 예시

```json
{
  "diagnosisStatus": "reviewing"
}
```

#### Response 예시

```json
{
  "success": true,
  "message": "진단 상태가 업데이트되었습니다.",
  "data": {
    "id": "diag_001",
    "diagnosisStatus": "reviewing"
  }
}
```

---

### 9.5 파일 업로드 API

```http
POST /api/export-diagnosis/upload
```

### 허용 파일

```text
- jpg
- jpeg
- png
- pdf
- xlsx
- docx
```

### 파일 용도

```text
- 제품 사진
- 제품 카탈로그
- 성분표
- 인증서
- 임상 자료
- 회사소개서
```

### Response 예시

```json
{
  "success": true,
  "message": "파일 업로드가 완료되었습니다.",
  "data": {
    "fileName": "product_catalog.pdf",
    "fileUrl": "/uploads/product_catalog.pdf",
    "fileType": "pdf"
  }
}
```

---

## 10. DB 스키마 예시

### Prisma 예시

```prisma
model ExportDiagnosisRequest {
  id                         String   @id @default(cuid())

  // Step 1. 기본 정보
  contactName                String
  companyName                String
  position                   String?
  email                      String
  phone                      String
  brandUrl                   String?
  annualRevenueRange         String?

  // Step 2. 제품 정보
  productName                String
  productCategory            String
  productFiles               Json?
  hasInci                    String
  volumeAndPriceRange        String?
  isSellingInKorea           String
  monthlySalesOrBestSeller   String?
  certifications             String[]

  // Step 3. 수출 목표 및 현재 상태
  targetCountries            String[]
  preferredChannels          String[]
  exportExperience           String
  tradeFairExperience        String?
  hasExistingBuyer           String
  painPoints                 String[]

  // Step 4. 진단 상태
  diagnosisStatus            String   @default("submitted")
  diagnosisResult            Json?
  adminMemo                  String?

  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt
  submittedAt                DateTime?
}
```

---

## 11. Validation Rules

### 필수 검증

다음 필드는 반드시 입력되어야 한다.

```text
contactName
companyName
email
phone
productName
productCategory
hasInci
isSellingInKorea
certifications
targetCountries
exportExperience
hasExistingBuyer
painPoints
```

### 이메일 검증

```text
email 형식이 올바르지 않으면 제출 불가
```

### 전화번호 검증

```text
한국 전화번호 형식 우선 허용
예: 010-1234-5678, 02-123-4567
```

### 배열 필드 검증

다음 필드는 최소 1개 이상 선택되어야 한다.

```text
certifications
targetCountries
painPoints
```

### 파일 검증

```text
파일 1개당 최대 10MB
총 업로드 최대 50MB
허용 확장자: jpg, jpeg, png, pdf, xlsx, docx
```

---

## 12. 진단 결과 데이터 구조: 향후 확장용

MVP에서는 실제 AI 진단이 없어도 되지만, 향후 아래 구조로 결과를 저장할 수 있게 준비한다.

```json
{
  "overallScore": 72,
  "readinessLevel": "부분 준비됨",
  "summary": "제품과 국내 판매 실적은 있으나 EU 규제 문서와 바이어 Follow-up 체계 보완이 필요합니다.",
  "sections": {
    "productReadiness": {
      "score": 80,
      "comment": "제품 정보와 국내 판매 실적은 긍정적입니다."
    },
    "euRegulationReadiness": {
      "score": 45,
      "comment": "CPNP, PIF, Responsible Person 확인이 필요합니다."
    },
    "salesMaterialReadiness": {
      "score": 60,
      "comment": "영문 카탈로그와 바이어용 Offer Sheet가 필요합니다."
    },
    "buyerFollowUpReadiness": {
      "score": 50,
      "comment": "바이어별 후속 메일과 미팅 기록 관리가 필요합니다."
    },
    "consultingNeed": {
      "level": "높음",
      "recommendedTopics": [
        "EU 규제/허가 검토",
        "바이어 Follow-up 전략",
        "가격/MOQ 협상"
      ]
    }
  },
  "nextActions": [
    "INCI 리스트와 인증 자료를 업로드하세요.",
    "France와 Germany 기준의 규제 체크리스트를 확인하세요.",
    "바이어 Follow-up 이메일 템플릿을 생성하세요."
  ]
}
```

---

## 13. 관리자 페이지 요구사항

관리자 페이지에서는 제출된 진단 요청을 확인할 수 있어야 한다.

### 목록에서 보여줄 항목

```text
- 제출일
- 회사명
- 담당자명
- 이메일
- 전화번호
- 대표 제품명
- 목표 국가
- 가장 어려운 부분
- 진단 상태
```

### 필터 기능

```text
- 진단 상태별 필터
- 목표 국가별 필터
- 제품 카테고리별 필터
- 제출일 기준 정렬
- 회사명 검색
```

### 상세 페이지에서 보여줄 항목

```text
- Step 1 기본 정보 전체
- Step 2 제품 정보 전체
- Step 3 수출 목표 및 현재 상태 전체
- 업로드 파일 목록
- 관리자 메모
- 진단 상태 변경
- 컨설팅 필요 여부 표시
```

---

## 14. 프론트엔드와 연동 시 화면 구조

### CTA 클릭 후 첫 화면 카피

```text
우리 브랜드의 유럽 수출 가능성을 진단해보세요.

회사와 제품 정보를 입력하면
EU 규제, 제품 카탈로그, 바이어 Follow-up, 협상 준비도를 기준으로
현재 수출 가능성과 필요한 다음 단계를 확인할 수 있습니다.
```

### 단계 표시

```text
1. 기본 정보
2. 제품 정보
3. 수출 목표
4. 진단하기
```

### Step 이동 규칙

- 현재 Step의 필수 항목이 모두 입력되어야 다음 Step으로 이동 가능
- 이전 Step으로 돌아가기 가능
- 마지막 Step에서 전체 입력 내용 요약 표시 후 제출

---

## 15. Claude에게 요청할 개발 작업

아래 요구사항에 맞춰 백엔드 코드를 작성해줘.

### 원하는 결과물

1. 백엔드 프로젝트 폴더 구조
2. DB 모델 또는 스키마
3. API 라우트 코드
4. Validation 로직
5. 파일 업로드 처리 코드
6. 관리자 조회 API
7. 상태 업데이트 API
8. 테스트용 샘플 요청/응답
9. 프론트엔드 연동 방법
10. 향후 AI 진단 기능 연결 방법

### 선호 기술 스택

가능하면 아래 중 하나로 구현해줘.

```text
Option A: Node.js + Express + Prisma + SQLite/PostgreSQL
Option B: Next.js API Routes + Prisma + SQLite/PostgreSQL
Option C: Supabase 기반 백엔드
```

우선 MVP이므로 빠르게 테스트 가능한 구조가 좋다.

---

## 16. Claude에게 줄 최종 지시문

```text
너는 시니어 백엔드 개발자야.

BridgeX라는 K-뷰티 유럽 수출 지원 웹서비스의 “우리 브랜드 수출 가능성 진단하기” 기능을 위한 백엔드를 만들어줘.

이 기능은 사용자가 3단계 인테이크 폼을 작성한 후 4단계에서 진단 버튼을 눌러 제출하는 구조야.

Step 1은 기본 정보, Step 2는 제품 정보, Step 3은 수출 목표 및 현재 상태, Step 4는 진단 제출이야.

실제 AI 진단은 지금 구현하지 않아도 되지만, 향후 AI 진단 결과를 저장할 수 있도록 diagnosisResult JSON 필드를 포함해줘.

필수 항목 검증, 파일 업로드, 제출 데이터 저장, 관리자 목록 조회, 상세 조회, 진단 상태 업데이트 API를 모두 구현해줘.

기술 스택은 Node.js + Express + Prisma + SQLite로 먼저 만들어줘. 이후 PostgreSQL로 쉽게 전환 가능하도록 작성해줘.

출력은 다음 순서로 제공해줘.

1. 프로젝트 폴더 구조
2. 설치 및 실행 방법
3. Prisma schema
4. API 라우트 코드
5. Validation 로직
6. 파일 업로드 코드
7. 관리자 조회/상세/상태 업데이트 API
8. 샘플 request/response
9. 프론트엔드 연동 방법
10. 향후 AI 진단 기능 연결 방식

코드는 바로 복사해서 실행할 수 있는 수준으로 완성해줘.
```
