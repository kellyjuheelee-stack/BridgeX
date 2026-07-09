const jwt = require('jsonwebtoken');
const memberService = require('../services/member.service');
const diagnosisService = require('../services/diagnosis.service');
const { validateMember, validateLogin } = require('../validators/member.validator');
const { getSecret } = require('../middleware/auth');
const emailTemplates = require('../constants/emailTemplates');
const ApiError = require('../utils/ApiError');

function issueToken(member) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '12h';
  const token = jwt.sign({ role: 'member', sub: member.id, email: member.email }, getSecret(), { expiresIn });
  return { token, expiresIn };
}

// POST /api/members — 회원가입 (공개). 가입 성공 시 바로 로그인 토큰도 발급.
async function register(req, res, next) {
  try {
    const errors = validateMember(req.body);
    if (errors.length > 0) throw new ApiError(400, '입력값 검증에 실패했습니다.', errors);

    const member = await memberService.createMember(req.body);

    // 비회원으로 방금 받은 진단이 있으면 이 계정에 연결 (흐름 2)
    if (req.body.diagnosisId) {
      try {
        await diagnosisService.linkOrphanDiagnosis(req.body.diagnosisId, member.id);
      } catch (e) {
        console.error('[member] link diagnosis', e);
      }
    }

    const { token, expiresIn } = issueToken(member);
    return res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: { token, expiresIn, member },
    });
  } catch (err) {
    if (err && err.code === 'P2002') return next(new ApiError(409, '이미 등록된 이메일입니다.'));
    next(err);
  }
}

// POST /api/members/login — 회원 로그인
async function login(req, res, next) {
  try {
    const errors = validateLogin(req.body);
    if (errors.length > 0) throw new ApiError(400, '입력값 검증에 실패했습니다.', errors);

    const found = await memberService.findByEmailWithHash(req.body.email);
    const ok = found && (await memberService.verifyPassword(req.body.password, found.passwordHash));
    if (!ok) throw new ApiError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');

    const member = await memberService.touchLastLogin(found.id);
    const { token, expiresIn } = issueToken(member);
    return res.json({ success: true, message: '로그인되었습니다.', data: { token, expiresIn, member } });
  } catch (err) {
    next(err);
  }
}

// GET /api/members/me — 내 정보 (회원 토큰 필요)
async function me(req, res, next) {
  try {
    const member = await memberService.getPublicById(req.member.id);
    if (!member) throw new ApiError(404, '회원 정보를 찾을 수 없습니다.');
    return res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
}

// GET /api/members/me/diagnoses — 내 진단 이력 (회원 토큰 필요)
async function myDiagnoses(req, res, next) {
  try {
    const data = await memberService.listMyDiagnoses(req.member.id);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/members/me/email-templates — 상황별 이메일 템플릿 목록 (회원)
function emailTemplateList(_req, res) {
  return res.json({ success: true, data: emailTemplates.templatesMeta() });
}

// POST /api/members/me/email-draft — 상황·바이어 입력으로 영문 초안 생성 (회원)
async function generateEmailDraft(req, res, next) {
  try {
    const { situation, inputs } = req.body || {};
    if (!situation) throw new ApiError(400, '상황(situation)을 선택해주세요.');
    const base = await memberService.getEmailContext(req.member.id);
    const ctx = Object.assign({}, base, inputs || {});
    const draft = emailTemplates.generate(situation, ctx);
    if (!draft) throw new ApiError(400, '유효하지 않은 상황입니다.');
    return res.json({ success: true, data: draft });
  } catch (err) {
    next(err);
  }
}

// GET /api/members — 회원 목록 (관리자 전용)
async function list(req, res, next) {
  try {
    const { data, pagination } = await memberService.listMembers(req.query);
    return res.json({ success: true, data, pagination });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, myDiagnoses, emailTemplateList, generateEmailDraft, list };
