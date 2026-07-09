// SQLite 호환을 위한 JSON 필드 직렬화 계층.
// 배열/객체 필드를 DB에는 JSON 문자열(TEXT)로 저장하고, 응답 시 다시 파싱한다.
// PostgreSQL 네이티브 배열/Json 으로 전환하면 이 파일만 비활성화하면 된다.

const ARRAY_FIELDS = [
  'certifications',
  'euComplianceReadiness',
  'packagingReadiness',
  'targetCountries',
  'preferredChannels',
  'painPoints',
  'meetings',
];
const OBJECT_FIELDS = ['productFiles', 'diagnosisResult', 'consultingChecklist'];
const JSON_FIELDS = [...ARRAY_FIELDS, ...OBJECT_FIELDS];

// 저장 직전: 배열/객체 → JSON 문자열
function serializeForDb(data) {
  const out = { ...data };
  for (const field of JSON_FIELDS) {
    if (out[field] === undefined) continue;
    if (out[field] === null) continue;
    out[field] = JSON.stringify(out[field]);
  }
  return out;
}

// 조회 직후: JSON 문자열 → 배열/객체.
// select 로 일부 컬럼만 조회한 경우, 존재하지 않는 필드에 기본값을 주입하지 않는다.
function deserializeFromDb(row) {
  if (!row) return row;
  const out = { ...row };
  for (const field of ARRAY_FIELDS) {
    if (field in out) out[field] = safeParse(out[field], []);
  }
  for (const field of OBJECT_FIELDS) {
    if (field in out) out[field] = safeParse(out[field], null);
  }
  return out;
}

function safeParse(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value; // 이미 파싱된 경우
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

module.exports = { serializeForDb, deserializeFromDb, JSON_FIELDS, ARRAY_FIELDS, OBJECT_FIELDS };
