// 로드맵 엔드투엔드 smoke. 서버 구동 상태에서 실행: `npm run smoke:roadmap`
const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
async function json(method, path, body, token) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const stamp = Date.now();
const memberPayload = {
  name: '로드맵테스트',
  companyName: '로드맵코스메틱',
  email: `roadmap+${stamp}@test.com`,
  phone: '010-0000-0000',
  password: 'roadmappass1',
};
const diagPayload = {
  contactName: '로드맵테스트', companyName: '로드맵코스메틱', email: memberPayload.email, phone: '010-0000-0000',
  productName: 'Test Cream', productCategory: '스킨케어', hasInci: 'INCI 리스트 보유',
  isSellingInKorea: '판매 중', certifications: ['ISO 22716'],
  euComplianceReadiness: ['CPNP 사전 등록', '제품정보파일(PIF) 구비'],
  packagingReadiness: [], targetCountries: ['France'],
  exportExperience: '없음', hasExistingBuyer: '없음', painPoints: ['유럽 규제/허가가 어렵습니다'],
};

async function run() {
  console.log(`\n▶ Roadmap smoke against ${BASE}\n`);

  const reg = await json('POST', '/api/members', memberPayload);
  check('회원가입 → 201 + token', reg.status === 201 && !!reg.data.data.token, `(got ${reg.status})`);
  const token = reg.data?.data?.token;

  const noDiag = await json('GET', '/api/members/me/roadmap', null, token);
  check('진단 전 → hasDiagnosis:false', noDiag.status === 200 && noDiag.data.data.hasDiagnosis === false);

  const diag = await json('POST', '/api/export-diagnosis', diagPayload, token);
  check('진단 제출(회원연결) → 201', diag.status === 201, `(got ${diag.status})`);

  const rm = await json('GET', '/api/members/me/roadmap', null, token);
  check('로드맵 → 16단계', rm.status === 200 && rm.data.data.steps.length === 16, `(got ${rm.data?.data?.steps?.length})`);
  check('diagnosisId 포함', !!rm.data.data.diagnosisId);
  const byId = Object.fromEntries((rm.data.data.steps || []).map((s) => [s.id, s]));
  check('eu_cpnp done 파생', byId.eu_cpnp && byId.eu_cpnp.done === true);
  check('eu_rp 미완료', byId.eu_rp && byId.eu_rp.done === false);
  check('expertRemaining > 0', rm.data.data.progress.expertRemaining > 0);
  const before = rm.data.data.progress.doneCount;

  const tog = await json('POST', '/api/members/me/roadmap/steps/eu_rp/toggle', { done: true }, token);
  check('토글 → doneCount +1', tog.status === 200 && tog.data.data.progress.doneCount === before + 1, `(got ${tog.data?.data?.progress?.doneCount})`);

  const bad = await json('POST', '/api/members/me/roadmap/steps/nope/toggle', { done: true }, token);
  check('잘못된 stepId → 400', bad.status === 400, `(got ${bad.status})`);

  const consult = await json('POST', `/api/export-diagnosis/${diag.data.data.id}/request-consultation`, { stepContext: 'CPNP 사전 등록' });
  check('단계맥락 상담신청 → consulting_needed', consult.status === 200 && consult.data.data.diagnosisStatus === 'consulting_needed', `(got ${consult.status})`);

  const noauth = await json('GET', '/api/members/me/roadmap');
  check('토큰 없음 → 401', noauth.status === 401, `(got ${noauth.status})`);

  console.log(`\n── Result: ${pass} passed, ${fail} failed ──\n`);
  process.exit(fail === 0 ? 0 : 1);
}
run().catch((e) => { console.error('crashed:', e); process.exit(1); });
