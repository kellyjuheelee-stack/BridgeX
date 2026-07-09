const express = require('express');
const ctrl = require('../controllers/diagnosis.controller');
const uploadCtrl = require('../controllers/upload.controller');
const { upload } = require('../middleware/upload');
const { requireAdmin, optionalMember } = require('../middleware/auth');

const router = express.Router();

// ── 공개 (인테이크 폼용) ──
router.post('/', optionalMember, ctrl.create); // 진단 요청 생성 (+ 즉시 자동 진단, 로그인 시 회원 연결)
router.get('/options', ctrl.options); // 옵션 목록 (:id 보다 먼저 선언)
router.post('/upload', upload.single('file'), uploadCtrl.uploadFile); // 파일 업로드
router.post('/:id/request-consultation', ctrl.requestConsultation); // 상담 신청 (훅 전환)

// ── 관리자 전용 (JWT 필요) ──
router.get('/', requireAdmin, ctrl.list); // 목록
router.get('/:id', requireAdmin, ctrl.getById); // 상세
router.patch('/:id/status', requireAdmin, ctrl.updateStatus); // 상태 변경
router.patch('/:id/consulting', requireAdmin, ctrl.updateConsulting); // 컨설팅 트랙
router.post('/:id/meetings', requireAdmin, ctrl.addMeeting); // 미팅 등록
router.delete('/:id/meetings/:meetingId', requireAdmin, ctrl.removeMeeting); // 미팅 삭제
router.post('/:id/diagnose', requireAdmin, ctrl.runDiagnosis); // 진단 실행

module.exports = router;
