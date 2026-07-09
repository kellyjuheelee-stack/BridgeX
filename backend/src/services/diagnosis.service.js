const prisma = require('../lib/prisma');
const { serializeForDb, deserializeFromDb } = require('../utils/serialize');

// 진단 요청 생성 (memberId: 로그인 회원이면 연결, 비회원이면 null)
async function createRequest(input, memberId = null) {
  const now = new Date();
  const data = serializeForDb({
    memberId: memberId ?? null,
    // Step 1
    contactName: input.contactName?.trim(),
    companyName: input.companyName?.trim(),
    position: input.position ?? null,
    email: input.email?.trim(),
    phone: input.phone?.trim(),
    homepageUrl: input.homepageUrl ?? null,
    smartStoreUrl: input.smartStoreUrl ?? null,
    instagramUrl: input.instagramUrl ?? null,
    annualRevenueRange: input.annualRevenueRange ?? null,
    // Step 2
    productName: input.productName?.trim(),
    productCategory: input.productCategory,
    productFiles: input.productFiles ?? null,
    hasInci: input.hasInci,
    volumeAndPriceRange: input.volumeAndPriceRange ?? null,
    isSellingInKorea: input.isSellingInKorea,
    monthlySalesOrBestSeller: input.monthlySalesOrBestSeller ?? null,
    certifications: input.certifications,
    euComplianceReadiness: input.euComplianceReadiness ?? null,
    packagingReadiness: input.packagingReadiness ?? null,
    // Step 3
    targetCountries: input.targetCountries,
    preferredChannels: input.preferredChannels ?? null,
    exportExperience: input.exportExperience,
    tradeFairExperience: input.tradeFairExperience ?? null,
    hasExistingBuyer: input.hasExistingBuyer,
    painPoints: input.painPoints,
    // Step 4
    diagnosisStatus: 'submitted',
    submittedAt: now,
  });

  const created = await prisma.exportDiagnosisRequest.create({ data });
  return deserializeFromDb(created);
}

// 관리자용 목록 조회 (필터 + 페이지네이션)
async function listRequests(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.status) where.diagnosisStatus = query.status;
  if (query.productCategory) where.productCategory = query.productCategory;
  if (query.companyName) where.companyName = { contains: query.companyName };
  // targetCountries 는 JSON 문자열로 저장되므로 부분일치로 필터
  if (query.country) where.targetCountries = { contains: query.country };

  const [rows, total] = await Promise.all([
    prisma.exportDiagnosisRequest.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip,
      take: limit,
      // 목록에서는 지시서 13장 항목만 선택
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        phone: true,
        productName: true,
        productCategory: true,
        targetCountries: true,
        painPoints: true,
        diagnosisStatus: true,
        submittedAt: true,
      },
    }),
    prisma.exportDiagnosisRequest.count({ where }),
  ]);

  return {
    data: rows.map(deserializeFromDb),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// 상세 조회
async function getRequestById(id) {
  const row = await prisma.exportDiagnosisRequest.findUnique({ where: { id } });
  return row ? deserializeFromDb(row) : null;
}

// 진단 상태 업데이트 (+ 선택적 관리자 메모)
async function updateStatus(id, { diagnosisStatus, adminMemo }) {
  const exists = await prisma.exportDiagnosisRequest.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return null;

  const updated = await prisma.exportDiagnosisRequest.update({
    where: { id },
    data: {
      diagnosisStatus,
      ...(adminMemo !== undefined ? { adminMemo } : {}),
    },
    select: { id: true, diagnosisStatus: true, adminMemo: true, updatedAt: true },
  });
  return updated;
}

const crypto = require('crypto');

// 미팅 등록 (관리자)
async function addMeeting(id, { title, type, scheduledAt, location }) {
  const found = await getRequestById(id);
  if (!found) return null;
  const meetings = Array.isArray(found.meetings) ? found.meetings : [];
  meetings.push({
    id: crypto.randomUUID(),
    title: (title && String(title).trim()) || '상담 미팅',
    type: type === 'offline' ? 'offline' : 'online',
    scheduledAt: scheduledAt || null,
    location: location ? String(location).trim() : '',
    status: 'scheduled',
  });
  const updated = await prisma.exportDiagnosisRequest.update({
    where: { id },
    data: serializeForDb({ meetings }),
  });
  return deserializeFromDb(updated);
}

// 미팅 삭제 (관리자)
async function removeMeeting(id, meetingId) {
  const found = await getRequestById(id);
  if (!found) return null;
  const meetings = (Array.isArray(found.meetings) ? found.meetings : []).filter((m) => m.id !== meetingId);
  const updated = await prisma.exportDiagnosisRequest.update({
    where: { id },
    data: serializeForDb({ meetings }),
  });
  return deserializeFromDb(updated);
}

// 컨설팅 진행 트랙 업데이트 (단계 + 체크리스트 + 메모)
async function updateConsulting(id, { consultingStage, consultingChecklist, consultingNotes }) {
  const exists = await prisma.exportDiagnosisRequest.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return null;
  const data = serializeForDb({
    ...(consultingStage !== undefined ? { consultingStage } : {}),
    ...(consultingChecklist !== undefined ? { consultingChecklist } : {}),
    ...(consultingNotes !== undefined ? { consultingNotes } : {}),
  });
  const updated = await prisma.exportDiagnosisRequest.update({ where: { id }, data });
  return deserializeFromDb(updated);
}

// 비회원이 만든 진단을 신규 회원 계정에 연결 (아직 미연결일 때만)
async function linkOrphanDiagnosis(diagnosisId, memberId) {
  if (!diagnosisId || !memberId) return null;
  const d = await prisma.exportDiagnosisRequest.findUnique({
    where: { id: diagnosisId },
    select: { id: true, memberId: true },
  });
  if (!d || d.memberId) return null; // 없거나 이미 연결됨
  return prisma.exportDiagnosisRequest.update({
    where: { id: diagnosisId },
    data: { memberId },
    select: { id: true },
  });
}

// 상담 신청 (훅 → 컨설팅 전환). 상태를 consulting_needed 로 전이.
async function requestConsultation(id) {
  const exists = await prisma.exportDiagnosisRequest.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return null;
  return prisma.exportDiagnosisRequest.update({
    where: { id },
    data: {
      consultationRequested: true,
      consultationRequestedAt: new Date(),
      diagnosisStatus: 'consulting_needed',
    },
    select: { id: true, diagnosisStatus: true, consultationRequested: true },
  });
}

// 향후 AI 진단 결과 저장 (aiDiagnosis.service 에서 호출)
async function saveDiagnosisResult(id, result, nextStatus = 'ai_generated') {
  const data = serializeForDb({ diagnosisResult: result, diagnosisStatus: nextStatus });
  const updated = await prisma.exportDiagnosisRequest.update({ where: { id }, data });
  return deserializeFromDb(updated);
}

module.exports = {
  createRequest,
  listRequests,
  getRequestById,
  updateStatus,
  updateConsulting,
  addMeeting,
  removeMeeting,
  requestConsultation,
  linkOrphanDiagnosis,
  saveDiagnosisResult,
};
