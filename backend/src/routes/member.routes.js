const express = require('express');
const ctrl = require('../controllers/member.controller');
const { requireAdmin, requireMember } = require('../middleware/auth');

const router = express.Router();

// 공개
router.post('/', ctrl.register); // 회원가입
router.post('/login', ctrl.login); // 로그인

// 회원 본인
router.get('/me', requireMember, ctrl.me); // 내 정보
router.get('/me/diagnoses', requireMember, ctrl.myDiagnoses); // 내 진단 이력
router.get('/me/email-templates', requireMember, ctrl.emailTemplateList); // 이메일 상황 템플릿
router.post('/me/email-draft', requireMember, ctrl.generateEmailDraft); // 이메일 초안 생성
router.get('/me/roadmap', requireMember, ctrl.myRoadmap); // 수출 실행 로드맵
router.post('/me/roadmap/steps/:stepId/toggle', requireMember, ctrl.toggleRoadmapStep); // 단계 토글
router.post('/me/catalog-audit', requireMember, ctrl.catalogAudit); // 카탈로그 컴플라이언스 점검

// 관리자
router.get('/', requireAdmin, ctrl.list); // 회원 목록

module.exports = router;
