# BridgeX Backend — 수출 가능성 진단 Intake Form API

K-뷰티 유럽 수출 지원 서비스 BridgeX의 **"우리 브랜드 수출 가능성 진단하기"** 기능 백엔드.
3단계 인테이크 폼 데이터를 수집·저장하고, 관리자 조회 및 (향후) AI 진단 연결을 위한 REST API를 제공한다.

- **스택:** Node.js + Express + Prisma + SQLite (→ PostgreSQL 전환 용이)
- **상태:** MVP. 실제 AI 진단/이메일 발송/PDF 분석/규제 DB 매칭은 스텁이며, 연결 지점만 설계되어 있다.

---

## 1. 프로젝트 폴더 구조

```
backend/
├─ prisma/
│  ├─ schema.prisma            # 데이터 모델 (ExportDiagnosisRequest)
│  ├─ migrations/              # 마이그레이션 이력
│  └─ dev.db                   # SQLite DB (gitignore)
├─ src/
│  ├─ server.js                # 진입점 (listen, graceful shutdown)
│  ├─ app.js                   # Express 앱 (미들웨어, 라우트 마운트)
│  ├─ lib/
│  │  └─ prisma.js             # PrismaClient 싱글턴
│  ├─ constants/
│  │  └─ enums.js              # 지시서 옵션 목록 + 상태값 + 파일 규칙
│  ├─ utils/
│  │  ├─ serialize.js          # SQLite용 JSON 필드 직렬화/역직렬화
│  │  └─ ApiError.js           # 표준 에러 객체
│  ├─ validators/
│  │  └─ diagnosis.validator.js# 필수/이메일/전화/배열 검증
│  ├─ middleware/
│  │  ├─ upload.js             # multer (확장자·용량 제한)
│  │  └─ errorHandler.js       # 404 + 공통 에러 응답
│  ├─ services/
│  │  ├─ diagnosis.service.js  # DB CRUD + 필터/페이지네이션
│  │  └─ aiDiagnosis.service.js# ★ 향후 AI 진단 연결 지점 (스텁)
│  ├─ controllers/
│  │  ├─ diagnosis.controller.js
│  │  └─ upload.controller.js
│  └─ routes/
│     └─ diagnosis.routes.js
├─ tests/
│  └─ smoke.mjs                # 전 엔드포인트 E2E 스모크 테스트
├─ uploads/                    # 업로드 파일 저장 (gitignore, 런타임 생성)
├─ .env / .env.example
└─ package.json
```

---

## 2. 설치 및 실행 방법

```bash
cd backend
npm install
npx prisma migrate dev --name init   # SQLite DB 생성 + 클라이언트 생성
npm run dev                          # http://localhost:4000 (--watch 자동 재시작)

# 프로덕션: npm start
# DB GUI:  npm run studio (Prisma Studio)
```

동작 검증:

```bash
npm run smoke      # 서버가 떠 있는 상태에서 실행 → 15개 케이스 통과 확인
curl http://localhost:4000/health
```

> 요구 사항: Node 18+ (개발/검증 환경 Node 24). 포트/DB는 `.env`로 설정.

---

## 3. 데이터 모델 (Prisma)

메인 엔티티 `ExportDiagnosisRequest` (테이블 `export_diagnosis_requests`). 전체 정의는
[`prisma/schema.prisma`](prisma/schema.prisma) 참고.

> **SQLite 제약 대응:** SQLite는 Prisma의 `String[]`·`Json`을 지원하지 않는다.
> 배열/객체 필드(`certifications`, `targetCountries`, `preferredChannels`, `painPoints`,
> `productFiles`, `diagnosisResult`)는 **TEXT에 JSON 문자열로 저장**하고
> [`src/utils/serialize.js`](src/utils/serialize.js)에서 자동 직렬화/역직렬화한다.
> API 입출력은 정상적인 JSON 배열/객체로 주고받으므로 클라이언트는 이를 신경 쓸 필요가 없다.

---

## 4. API 엔드포인트

Base URL: `http://localhost:4000`

Base URL: `http://localhost:4000` · 🔒 = 관리자 JWT 필요 (`Authorization: Bearer <token>`)

| Method | Path | 설명 |
|---|---|---|
| GET  | `/health` | 헬스체크 |
| POST | `/api/auth/login` | 관리자 로그인 → JWT 발급 |
| GET  | `/api/auth/me` | 🔒 토큰 유효성 확인 |
| GET  | `/api/export-diagnosis/options` | 프론트 드롭다운용 전체 옵션 목록 |
| POST | `/api/export-diagnosis` | **진단 요청 생성 + 즉시 자동 진단 결과 반환 (훅)** |
| POST | `/api/export-diagnosis/:id/request-consultation` | 상담 신청 → `consulting_needed` 전환 + 핫리드 알림 |
| POST | `/api/export-diagnosis/upload` | 파일 업로드 (field: `file`) |
| GET  | `/api/export-diagnosis` | 🔒 관리자용 목록 (필터·페이지네이션) |
| GET  | `/api/export-diagnosis/:id` | 🔒 상세 조회 |
| PATCH| `/api/export-diagnosis/:id/status` | 🔒 진단 상태 업데이트 |
| POST | `/api/export-diagnosis/:id/diagnose` | 🔒 (선택) 임시 AI 진단 실행 |

공개(인테이크 폼용): options / 생성 / 업로드. 그 외 관리자 API는 로그인 필요.

### 진단 상태값

`submitted` → `reviewing` → `ai_generated` → `consulting_needed` → `completed` → `archived`

### 관리자 인증

- `.env`의 `ADMIN_USERNAME` / `ADMIN_PASSWORD`로 로그인 → JWT(`JWT_EXPIRES_IN` 만료) 발급
- 관리자 페이지(`admin.html`)는 토큰을 localStorage에 저장하고 모든 요청에 `Authorization` 헤더로 첨부. 401 시 자동 로그아웃.

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" -d '{"username":"admin","password":"bridgex2026!"}'
# → { "data": { "token": "eyJ...", "expiresIn": "12h" } }
```
> ⚠️ 배포 전 `.env`의 `ADMIN_PASSWORD`와 `JWT_SECRET`을 반드시 강력한 값으로 교체.

### 이메일 발송 ([`services/email.service.js`](src/services/email.service.js))

| 시점 | 수신자 | 제목 |
|---|---|---|
| 진단 요청 접수 | 신청자 | 수출 가능성 진단 요청이 접수되었습니다 |
| 진단 요청 접수 | 관리자(`ADMIN_NOTIFY_EMAIL`) | 새 진단 요청 · {회사명} |
| 상태 → `completed` | 신청자 | 수출 가능성 진단 결과 안내 |

- **SMTP 미설정(`SMTP_HOST` 비움)** 시 실제 발송 없이 콘솔에 로그만 남김(개발 모드).
- 실제 발송: `.env`에 SMTP 정보 입력 (예: Gmail `smtp.gmail.com` / 587 / 앱 비밀번호).
- 메일 발송은 **비동기(fire-and-forget)** — 실패해도 접수/상태변경은 정상 처리.

---

## 5. Validation 로직 ([`validators/diagnosis.validator.js`](src/validators/diagnosis.validator.js))

- **필수 문자열:** contactName, companyName, email, phone, productName, productCategory, hasInci, isSellingInKorea, exportExperience, hasExistingBuyer
- **필수 배열(최소 1개):** certifications, targetCountries, painPoints
- **이메일:** 형식 검증 실패 시 제출 불가
- **전화:** 한국 번호 우선 (`010-1234-5678`, `02-123-4567`)
- 실패 시 `400` + 필드별 `errors` 배열 반환

---

## 6. 파일 업로드 ([`middleware/upload.js`](src/middleware/upload.js))

- 허용 확장자: `jpg, jpeg, png, pdf, xlsx, docx`
- 파일당 최대 **10MB**
- 저장 위치: `uploads/` → `fileUrl`(`/uploads/...`)로 정적 서빙
- 여러 파일은 프론트에서 업로드를 반복 호출하고, 반환된 `{fileName, fileUrl, fileType}`
  배열을 진단 생성 시 `productFiles`로 전달

---

## 7. 샘플 request / response

### 생성

```bash
curl -X POST http://localhost:4000/api/export-diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "contactName":"홍길동","companyName":"뷰티코스메틱","position":"대표",
    "email":"hello@beautycosmetic.com","phone":"010-1234-5678",
    "productName":"Barrier Repair Cream","productCategory":"스킨케어",
    "hasInci":"INCI 리스트 보유","isSellingInKorea":"판매 중",
    "certifications":["ISO 22716","비건 인증"],
    "targetCountries":["France","Germany"],
    "exportExperience":"바이어 미팅 경험 있음",
    "hasExistingBuyer":"없음",
    "painPoints":["유럽 규제/허가가 어렵습니다"]
  }'
```

```json
{
  "success": true,
  "message": "수출 가능성 진단 요청이 접수되었습니다.",
  "data": { "id": "clx...", "diagnosisStatus": "submitted", "submittedAt": "2026-07-06T..." }
}
```

### 목록 (필터)

```bash
curl "http://localhost:4000/api/export-diagnosis?status=submitted&country=France&companyName=뷰티&page=1&limit=20"
```

### 상태 업데이트

```bash
curl -X PATCH http://localhost:4000/api/export-diagnosis/<id>/status \
  -H "Content-Type: application/json" -d '{"diagnosisStatus":"reviewing"}'
```

### 파일 업로드

```bash
curl -X POST http://localhost:4000/api/export-diagnosis/upload -F "file=@catalog.pdf"
```

---

## 8. 프론트엔드 연동 방법

1. **CTA 클릭** → 인테이크 폼(4단계) 진입
2. **옵션 로드:** 마운트 시 `GET /options` 한 번 호출 → 드롭다운/체크박스 렌더
3. **파일:** Step 2에서 파일 선택 시 `POST /upload` 호출 → 반환 객체를 폼 상태에 누적
4. **제출(Step 4):** 3단계 입력값 + `productFiles` 배열을 합쳐 `POST /api/export-diagnosis` 전송
5. **완료 화면:** 성공 응답 시 안내 문구 표시
   > 수출 가능성 진단 요청이 접수되었습니다.
   > 입력하신 이메일로 진단 결과와 다음 단계를 안내드리겠습니다.

- CORS는 `.env`의 `CORS_ORIGIN`으로 제어 (기본 `*`, 배포 시 도메인 지정)
- 랜딩(`../index.html`)의 "우리 브랜드 수출 가능성 진단하기" 버튼이 이 폼의 진입점.
  현재 버튼은 접수 확인만 표시하므로, 이 API를 붙이는 것이 다음 프론트 작업.

---

## 9. 향후 AI 진단 연결 방식 ([`services/aiDiagnosis.service.js`](src/services/aiDiagnosis.service.js))

- DB의 `diagnosisResult`(JSON) 필드에 지시서 12장 구조(overallScore, sections, nextActions…)를 저장
- 현재는 **규칙 기반 임시 스텁**이 점수를 산출 (`POST /:id/diagnose`로 테스트 가능)
- 실제 연동 시 `generateDiagnosis(request)` **함수 본문만 교체**하면 라우트/서비스 변경 불필요:
  - LLM 호출(Claude/OpenAI)로 요약·코멘트 생성
  - 업로드 PDF/카탈로그 파싱
  - EU 규제(CPNP/PIF) DB 매칭
- 저장은 `diagnosisService.saveDiagnosisResult(id, result)`가 담당하며 상태를 `ai_generated`로 전이

---

## 10. PostgreSQL 전환

1. `prisma/schema.prisma`의 `datasource db { provider = "postgresql" }`로 변경
2. `.env`의 `DATABASE_URL`을 `postgresql://...`로 변경
3. (선택) 배열/JSON 필드를 native `String[]`/`Json`으로 바꾸고 `serialize.js`의 `JSON_FIELDS`에서 제외
4. `npx prisma migrate dev`

---

## 검증 결과

`npm run smoke` — 15개 케이스 전체 통과 (health, options, 생성 성공/검증실패, 목록·필터,
상세, 상태 업데이트 성공/실패, 업로드 허용/차단, AI 진단 스텁, 404).
