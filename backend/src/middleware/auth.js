const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new ApiError(500, '서버에 JWT_SECRET 이 설정되지 않았습니다.');
  return s;
}

// 관리자 JWT 검증 미들웨어. Authorization: Bearer <token> 필요.
function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, '인증이 필요합니다. 로그인해주세요.'));

  try {
    const payload = jwt.verify(token, getSecret());
    if (payload.role !== 'admin') return next(new ApiError(403, '권한이 없습니다.'));
    req.admin = { username: payload.username };
    next();
  } catch {
    next(new ApiError(401, '세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.'));
  }
}

// 회원 JWT 검증 미들웨어. Authorization: Bearer <token> 필요 (role: member).
function requireMember(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, '로그인이 필요합니다.'));

  try {
    const payload = jwt.verify(token, getSecret());
    if (payload.role !== 'member') return next(new ApiError(403, '회원 권한이 필요합니다.'));
    req.member = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new ApiError(401, '세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.'));
  }
}

// 선택적 회원 인증: 유효한 회원 토큰이 있으면 req.member 세팅, 없어도 통과.
// (비회원도 쓰는 공개 엔드포인트에서 로그인 회원을 식별할 때)
function optionalMember(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, getSecret());
    if (payload.role === 'member') req.member = { id: payload.sub, email: payload.email };
  } catch {
    /* 무효 토큰은 무시하고 비회원으로 진행 */
  }
  next();
}

module.exports = { requireAdmin, requireMember, optionalMember, getSecret };
