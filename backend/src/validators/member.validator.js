const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// 회원가입 검증 (이름·회사명·이메일·전화번호 모두 필수)
function validateMember(body = {}) {
  const errors = [];
  for (const [field, label] of [
    ['name', '이름'],
    ['companyName', '회사명'],
    ['email', '이메일'],
    ['phone', '전화번호'],
  ]) {
    if (!isNonEmptyString(body[field])) errors.push({ field, message: `${label}은(는) 필수 입력입니다.` });
  }
  if (isNonEmptyString(body.email) && !EMAIL_REGEX.test(body.email.trim())) {
    errors.push({ field: 'email', message: '이메일 형식이 올바르지 않습니다.' });
  }
  if (isNonEmptyString(body.phone) && !PHONE_REGEX.test(body.phone.trim().replace(/\s/g, ''))) {
    errors.push({ field: 'phone', message: '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)' });
  }
  if (!isNonEmptyString(body.password)) {
    errors.push({ field: 'password', message: '비밀번호는 필수 입력입니다.' });
  } else if (body.password.length < 8) {
    errors.push({ field: 'password', message: '비밀번호는 8자 이상이어야 합니다.' });
  }
  return errors;
}

// 로그인 검증 (이메일 · 비밀번호)
function validateLogin(body = {}) {
  const errors = [];
  if (!isNonEmptyString(body.email)) errors.push({ field: 'email', message: '이메일을 입력해주세요.' });
  if (!isNonEmptyString(body.password)) errors.push({ field: 'password', message: '비밀번호를 입력해주세요.' });
  return errors;
}

module.exports = { validateMember, validateLogin };
