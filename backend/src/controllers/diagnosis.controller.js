const diagnosisService = require('../services/diagnosis.service');
const aiDiagnosisService = require('../services/aiDiagnosis.service');
const emailService = require('../services/email.service');
const { validateCreate, validateStatusUpdate } = require('../validators/diagnosis.validator');
const ApiError = require('../utils/ApiError');
const enums = require('../constants/enums');

// POST /api/export-diagnosis — 진단 요청 생성 (Step 4 제출)
async function create(req, res, next) {
  try {
    const errors = validateCreate(req.body);
    if (errors.length > 0) {
      throw new ApiError(400, '입력값 검증에 실패했습니다.', errors);
    }
    const created = await diagnosisService.createRequest(req.body, req.member?.id || null);

    // 제출 즉시 기본 자동 진단 결과 생성 (훅). 실패해도 접수는 유효.
    let diagnosisResult = null;
    try {
      diagnosisResult = aiDiagnosisService.generateDiagnosis(created);
      await diagnosisService.saveDiagnosisResult(created.id, diagnosisResult, 'submitted');
    } catch (e) {
      console.error('[diagnosis] auto-generate', e);
    }

    // 접수 확인 + 관리자 알림 메일 (비동기, 응답을 막지 않음)
    emailService.sendSubmissionEmails(created).catch((e) => console.error('[email] submission', e));

    return res.status(201).json({
      success: true,
      message: '수출 가능성 진단 요청이 접수되었습니다.',
      data: {
        id: created.id,
        diagnosisStatus: created.diagnosisStatus,
        submittedAt: created.submittedAt,
        diagnosisResult,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/export-diagnosis — 관리자용 목록
async function list(req, res, next) {
  try {
    const { data, pagination } = await diagnosisService.listRequests(req.query);
    return res.json({ success: true, data, pagination });
  } catch (err) {
    next(err);
  }
}

// GET /api/export-diagnosis/options — 프론트 드롭다운용 옵션 목록
function options(_req, res) {
  return res.json({
    success: true,
    data: {
      annualRevenueRanges: enums.ANNUAL_REVENUE_RANGES,
      productCategories: enums.PRODUCT_CATEGORIES,
      hasInci: enums.HAS_INCI_OPTIONS,
      isSellingInKorea: enums.IS_SELLING_IN_KOREA_OPTIONS,
      certifications: enums.CERTIFICATION_OPTIONS,
      euComplianceReadiness: enums.EU_COMPLIANCE_OPTIONS,
      packagingReadiness: enums.PACKAGING_READINESS_OPTIONS,
      targetCountries: enums.TARGET_COUNTRY_OPTIONS,
      preferredChannels: enums.PREFERRED_CHANNEL_OPTIONS,
      exportExperience: enums.EXPORT_EXPERIENCE_OPTIONS,
      tradeFairExperience: enums.TRADE_FAIR_EXPERIENCE_OPTIONS,
      hasExistingBuyer: enums.HAS_EXISTING_BUYER_OPTIONS,
      painPoints: enums.PAIN_POINT_OPTIONS,
      diagnosisStatuses: enums.DIAGNOSIS_STATUSES,
      consultingStages: enums.CONSULTING_STAGES,
      allowedFileExtensions: enums.ALLOWED_FILE_EXTENSIONS,
    },
  });
}

// GET /api/export-diagnosis/:id — 상세
async function getById(req, res, next) {
  try {
    const found = await diagnosisService.getRequestById(req.params.id);
    if (!found) throw new ApiError(404, '해당 진단 요청을 찾을 수 없습니다.');
    return res.json({ success: true, data: found });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/export-diagnosis/:id/status — 상태 업데이트
async function updateStatus(req, res, next) {
  try {
    const errors = validateStatusUpdate(req.body);
    if (errors.length > 0) throw new ApiError(400, '입력값 검증에 실패했습니다.', errors);

    const updated = await diagnosisService.updateStatus(req.params.id, req.body);
    if (!updated) throw new ApiError(404, '해당 진단 요청을 찾을 수 없습니다.');

    // 상태가 '진단 완료'로 바뀌면 신청자에게 결과 안내 메일 (비동기)
    if (req.body.diagnosisStatus === 'completed') {
      diagnosisService
        .getRequestById(req.params.id)
        .then((full) => full && emailService.sendResultReadyEmail(full))
        .catch((e) => console.error('[email] result', e));
    }

    return res.json({
      success: true,
      message: '진단 상태가 업데이트되었습니다.',
      data: { id: updated.id, diagnosisStatus: updated.diagnosisStatus },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/export-diagnosis/:id/diagnose — (선택) 임시 AI 진단 실행
async function runDiagnosis(req, res, next) {
  try {
    const found = await diagnosisService.getRequestById(req.params.id);
    if (!found) throw new ApiError(404, '해당 진단 요청을 찾을 수 없습니다.');
    const updated = await aiDiagnosisService.runAndSave(found);
    return res.json({
      success: true,
      message: '임시 진단이 생성되었습니다. (실제 AI 연동 시 교체 예정)',
      data: { id: updated.id, diagnosisStatus: updated.diagnosisStatus, diagnosisResult: updated.diagnosisResult },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/export-diagnosis/:id/consulting — 컨설팅 트랙 업데이트 (관리자)
async function updateConsulting(req, res, next) {
  try {
    const updated = await diagnosisService.updateConsulting(req.params.id, req.body);
    if (!updated) throw new ApiError(404, '해당 진단 요청을 찾을 수 없습니다.');
    return res.json({
      success: true,
      message: '컨설팅 진행 상황이 저장되었습니다.',
      data: {
        id: updated.id,
        consultingStage: updated.consultingStage,
        consultingChecklist: updated.consultingChecklist,
        consultingNotes: updated.consultingNotes,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/export-diagnosis/:id/meetings — 미팅 등록 (관리자)
async function addMeeting(req, res, next) {
  try {
    const updated = await diagnosisService.addMeeting(req.params.id, req.body || {});
    if (!updated) throw new ApiError(404, '해당 진단 요청을 찾을 수 없습니다.');
    return res.status(201).json({ success: true, message: '미팅이 등록되었습니다.', data: { meetings: updated.meetings } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/export-diagnosis/:id/meetings/:meetingId — 미팅 삭제 (관리자)
async function removeMeeting(req, res, next) {
  try {
    const updated = await diagnosisService.removeMeeting(req.params.id, req.params.meetingId);
    if (!updated) throw new ApiError(404, '해당 진단 요청을 찾을 수 없습니다.');
    return res.json({ success: true, message: '미팅이 삭제되었습니다.', data: { meetings: updated.meetings } });
  } catch (err) {
    next(err);
  }
}

// POST /api/export-diagnosis/:id/request-consultation — 상담 신청 (공개, 훅 → 전환)
async function requestConsultation(req, res, next) {
  try {
    const updated = await diagnosisService.requestConsultation(req.params.id, (req.body && req.body.stepContext) || null);
    if (!updated) throw new ApiError(404, '해당 진단 요청을 찾을 수 없습니다.');

    // 관리자에게 핫리드 알림 + 신청자 확인 (비동기)
    diagnosisService
      .getRequestById(req.params.id)
      .then((full) => full && emailService.sendConsultationEmails(full))
      .catch((e) => console.error('[email] consultation', e));

    return res.json({
      success: true,
      message: '상담 신청이 접수되었습니다. 담당자가 곧 연락드리겠습니다.',
      data: { id: updated.id, diagnosisStatus: updated.diagnosisStatus, consultationRequested: updated.consultationRequested },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, options, getById, updateStatus, updateConsulting, addMeeting, removeMeeting, runDiagnosis, requestConsultation };
