const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { deserializeFromDb } = require('../utils/serialize');
const roadmapService = require('./roadmap.service');

// 응답에서 제외할 민감 필드
const PUBLIC_SELECT = {
  id: true,
  name: true,
  companyName: true,
  email: true,
  phone: true,
  createdAt: true,
  lastLoginAt: true,
};

async function createMember(input) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.member.create({
    data: {
      name: input.name?.trim(),
      companyName: input.companyName?.trim(),
      email: input.email?.trim().toLowerCase(),
      phone: input.phone?.trim(),
      passwordHash,
    },
    select: PUBLIC_SELECT,
  });
}

// 로그인용: 비밀번호 해시 포함 조회
async function findByEmailWithHash(email) {
  return prisma.member.findUnique({ where: { email: email?.trim().toLowerCase() } });
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

async function touchLastLogin(id) {
  return prisma.member.update({ where: { id }, data: { lastLoginAt: new Date() }, select: PUBLIC_SELECT });
}

async function getPublicById(id) {
  return prisma.member.findUnique({ where: { id }, select: PUBLIC_SELECT });
}

async function listMembers(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.companyName) where.companyName = { contains: query.companyName };
  if (query.email) where.email = { contains: query.email };

  const [data, total] = await Promise.all([
    prisma.member.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, select: PUBLIC_SELECT }),
    prisma.member.count({ where }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// 회원 본인의 진단 이력 (최신순)
async function listMyDiagnoses(memberId) {
  const rows = await prisma.exportDiagnosisRequest.findMany({
    where: { memberId },
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      productName: true,
      productCategory: true,
      targetCountries: true,
      diagnosisStatus: true,
      diagnosisResult: true,
      consultationRequested: true,
      consultingStage: true,
      meetings: true,
      submittedAt: true,
    },
  });
  return rows.map(deserializeFromDb);
}

// 이메일 초안 생성용 컨텍스트 (회원 프로필 + 최근 진단 데이터)
async function getEmailContext(memberId) {
  const member = await prisma.member.findUnique({ where: { id: memberId }, select: { name: true, companyName: true } });
  const latest = await prisma.exportDiagnosisRequest.findFirst({ where: { memberId }, orderBy: { submittedAt: 'desc' } });
  const d = latest ? deserializeFromDb(latest) : null;
  return {
    contactName: member ? member.name : '',
    brand: (member && member.companyName) || (d && d.companyName) || '',
    product: d ? d.productName : '',
    category: d ? d.productCategory : '',
    countries: d ? d.targetCountries : [],
    certs: d ? d.certifications : [],
    price: d ? d.volumeAndPriceRange : '',
    sales: d ? d.monthlySalesOrBestSeller : '',
    sellingInKorea: d ? ['판매 중', '테스트 판매 중'].includes(d.isSellingInKorea) : false,
  };
}

function parseProgress(raw) {
  if (!raw || typeof raw !== 'string') return {};
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

// 회원의 최신 진단 기반 로드맵 + 진행률
async function getRoadmap(memberId) {
  const latest = await prisma.exportDiagnosisRequest.findFirst({
    where: { memberId },
    orderBy: { submittedAt: 'desc' },
  });
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { roadmapProgress: true },
  });
  const progress = parseProgress(member && member.roadmapProgress);

  if (!latest) {
    return { hasDiagnosis: false, steps: [], progress: { total: 0, doneCount: 0, expertRemaining: 0, percent: 0 } };
  }
  const d = deserializeFromDb(latest);
  const built = roadmapService.buildRoadmap(d, progress);
  return { hasDiagnosis: true, diagnosisId: d.id, steps: built.steps, progress: built.progress };
}

// 단계 완료/해제 토글 후 갱신된 로드맵 반환
async function toggleRoadmapStep(memberId, stepId, done) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { roadmapProgress: true },
  });
  const progress = parseProgress(member && member.roadmapProgress);
  progress[stepId] = { done: !!done, doneAt: done ? new Date().toISOString() : null };
  await prisma.member.update({
    where: { id: memberId },
    data: { roadmapProgress: JSON.stringify(progress) },
  });
  return getRoadmap(memberId);
}

// 회원 최신 진단 id (없으면 null) — 카탈로그 점검 결과의 상담 CTA용
async function getLatestDiagnosisId(memberId) {
  const latest = await prisma.exportDiagnosisRequest.findFirst({
    where: { memberId },
    orderBy: { submittedAt: 'desc' },
    select: { id: true },
  });
  return latest ? latest.id : null;
}

module.exports = {
  createMember,
  findByEmailWithHash,
  verifyPassword,
  touchLastLogin,
  getPublicById,
  listMembers,
  listMyDiagnoses,
  getEmailContext,
  getRoadmap,
  toggleRoadmapStep,
  getLatestDiagnosisId,
};
