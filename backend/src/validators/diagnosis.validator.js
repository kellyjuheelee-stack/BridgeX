const { DIAGNOSIS_STATUSES } = require('../constants/enums');

// 지시서 11장 Validation Rules

// 필수 문자열 필드
const REQUIRED_STRING_FIELDS = [
  'contactName',
  'companyName',
  'email',
  'phone',
  'productName',
  'productCategory',
  'hasInci',
  'isSellingInKorea',
  'exportExperience',
  'hasExistingBuyer',
];

// 최소 1개 이상 선택되어야 하는 배열 필드
const REQUIRED_ARRAY_FIELDS = ['certifications', 'targetCountries', 'painPoints'];

// 선택 배열 필드 (제공되면 배열이어야 함)
const OPTIONAL_ARRAY_FIELDS = ['preferredChannels'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 한국 전화번호 우선 허용: 010-1234-5678, 02-123-4567, 0212345678 등
const PHONE_REGEX = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

// 진단 요청 생성(POST) 검증. 에러 배열을 반환하며, 비어있으면 통과.
function validateCreate(body = {}) {
  const errors = [];

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!isNonEmptyString(body[field])) {
      errors.push({ field, message: `${field} 은(는) 필수 입력입니다.` });
    }
  }

  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (!Array.isArray(body[field]) || body[field].length === 0) {
      errors.push({ field, message: `${field} 은(는) 최소 1개 이상 선택해야 합니다.` });
    }
  }

  for (const field of OPTIONAL_ARRAY_FIELDS) {
    if (body[field] !== undefined && body[field] !== null && !Array.isArray(body[field])) {
      errors.push({ field, message: `${field} 은(는) 배열이어야 합니다.` });
    }
  }

  if (isNonEmptyString(body.email) && !EMAIL_REGEX.test(body.email.trim())) {
    errors.push({ field: 'email', message: '이메일 형식이 올바르지 않습니다.' });
  }

  if (isNonEmptyString(body.phone) && !PHONE_REGEX.test(body.phone.trim().replace(/\s/g, ''))) {
    errors.push({
      field: 'phone',
      message: '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)',
    });
  }

  // productFiles 가 오면 배열이어야 함
  if (body.productFiles !== undefined && body.productFiles !== null && !Array.isArray(body.productFiles)) {
    errors.push({ field: 'productFiles', message: 'productFiles 은(는) 배열이어야 합니다.' });
  }

  return errors;
}

// 진단 상태 업데이트(PATCH) 검증
function validateStatusUpdate(body = {}) {
  const errors = [];
  if (!isNonEmptyString(body.diagnosisStatus)) {
    errors.push({ field: 'diagnosisStatus', message: 'diagnosisStatus 는 필수입니다.' });
  } else if (!DIAGNOSIS_STATUSES.includes(body.diagnosisStatus)) {
    errors.push({
      field: 'diagnosisStatus',
      message: `허용되지 않는 상태값입니다. 허용: ${DIAGNOSIS_STATUSES.join(', ')}`,
    });
  }
  return errors;
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

module.exports = { validateCreate, validateStatusUpdate, REQUIRED_STRING_FIELDS, REQUIRED_ARRAY_FIELDS };
