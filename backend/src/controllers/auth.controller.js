const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { getSecret } = require('../middleware/auth');

// 길이가 달라도 안전하게 비교 (타이밍 공격 완화): sha256 다이제스트 고정 길이 비교
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// POST /api/auth/login  { username, password }
function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) throw new ApiError(400, '아이디와 비밀번호를 입력해주세요.');

    const okUser = safeEqual(username, process.env.ADMIN_USERNAME || '');
    const okPass = safeEqual(password, process.env.ADMIN_PASSWORD || '');
    // 두 비교를 모두 수행한 뒤 판정 (early-return 타이밍 차이 방지)
    if (!(okUser && okPass)) throw new ApiError(401, '아이디 또는 비밀번호가 올바르지 않습니다.');

    const expiresIn = process.env.JWT_EXPIRES_IN || '12h';
    const token = jwt.sign({ role: 'admin', username }, getSecret(), { expiresIn });

    return res.json({ success: true, message: '로그인되었습니다.', data: { token, expiresIn } });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me — 토큰 유효성 확인 (관리자 페이지 진입 시)
function me(req, res) {
  return res.json({ success: true, data: { username: req.admin.username } });
}

module.exports = { login, me };
