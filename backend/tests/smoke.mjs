// End-to-end smoke test. 서버가 떠 있는 상태에서 실행: `npm run smoke`
// 모든 엔드포인트를 순서대로 호출하고 결과를 출력한다. Node 18+ 내장 fetch/FormData/Blob 사용.

const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

let pass = 0;
let fail = 0;

function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name} ${extra}`);
  }
}

async function json(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const validPayload = {
  contactName: '홍길동',
  companyName: '뷰티코스메틱',
  position: '대표',
  email: 'hello@beautycosmetic.com',
  phone: '010-1234-5678',
  homepageUrl: 'https://beautycosmetic.com',
  smartStoreUrl: 'https://smartstore.naver.com/beautycosmetic',
  instagramUrl: 'https://instagram.com/beautycosmetic',
  annualRevenueRange: '5억 ~ 10억',
  productName: 'Barrier Repair Cream',
  productCategory: '스킨케어',
  hasInci: 'INCI 리스트 보유',
  volumeAndPriceRange: '50ml / 소비자가 32,000원',
  isSellingInKorea: '판매 중',
  monthlySalesOrBestSeller: '월 3,000개 판매 / 베스트셀러',
  certifications: ['ISO 22716', '저자극 테스트', '비건 인증'],
  targetCountries: ['France', 'Germany'],
  preferredChannels: ['약국/더마코스메틱 채널', '유통사/디스트리뷰터'],
  exportExperience: '바이어 미팅 경험 있음',
  tradeFairExperience: '해외 박람회 참가 경험 있음',
  hasExistingBuyer: '대화 중인 바이어는 있으나 진행이 멈춤',
  painPoints: ['유럽 규제/허가가 어렵습니다', '박람회 이후 바이어 Follow-up이 안 됩니다'],
};

async function run() {
  console.log(`\n▶ Smoke test against ${BASE}\n`);

  console.log('[health]');
  const health = await json('GET', '/health');
  check('GET /health → 200', health.status === 200 && health.data.success);

  console.log('[options]');
  const opts = await json('GET', '/api/export-diagnosis/options');
  check('GET /options → 200 + productCategories', opts.status === 200 && Array.isArray(opts.data.data.productCategories));

  console.log('[create - invalid]');
  const bad = await json('POST', '/api/export-diagnosis', { contactName: '', email: 'nope', phone: 'x', certifications: [] });
  check('POST invalid → 400 with errors', bad.status === 400 && Array.isArray(bad.data.errors), `(got ${bad.status})`);

  console.log('[create - valid]');
  const created = await json('POST', '/api/export-diagnosis', validPayload);
  check('POST valid → 201 submitted', created.status === 201 && created.data.data.diagnosisStatus === 'submitted', `(got ${created.status})`);
  const id = created.data?.data?.id;
  check('returns id', !!id);

  console.log('[list]');
  const list = await json('GET', '/api/export-diagnosis?status=submitted&country=France&page=1&limit=20');
  check('GET list → 200 + pagination', list.status === 200 && list.data.pagination.total >= 1);
  check('country=France filter matches', list.data.data.some((r) => r.targetCountries.includes('France')));

  console.log('[detail]');
  const detail = await json('GET', `/api/export-diagnosis/${id}`);
  check('GET :id → 200 full record', detail.status === 200 && detail.data.data.companyName === '뷰티코스메틱');
  check('arrays deserialized', Array.isArray(detail.data.data.certifications) && detail.data.data.certifications.length === 3);

  console.log('[status update]');
  const patched = await json('PATCH', `/api/export-diagnosis/${id}/status`, { diagnosisStatus: 'reviewing' });
  check('PATCH status → reviewing', patched.status === 200 && patched.data.data.diagnosisStatus === 'reviewing');
  const badStatus = await json('PATCH', `/api/export-diagnosis/${id}/status`, { diagnosisStatus: 'bogus' });
  check('PATCH invalid status → 400', badStatus.status === 400);

  console.log('[upload]');
  const fd = new FormData();
  fd.append('file', new Blob(['%PDF-1.4 fake pdf'], { type: 'application/pdf' }), 'product_catalog.pdf');
  const upRes = await fetch(BASE + '/api/export-diagnosis/upload', { method: 'POST', body: fd });
  const upData = await upRes.json().catch(() => ({}));
  check('POST upload pdf → 200 + fileUrl', upRes.status === 200 && upData.data?.fileUrl?.startsWith('/uploads/'), `(got ${upRes.status})`);
  const badUp = new FormData();
  badUp.append('file', new Blob(['x'], { type: 'text/plain' }), 'notes.txt');
  const badUpRes = await fetch(BASE + '/api/export-diagnosis/upload', { method: 'POST', body: badUp });
  check('POST upload .txt → 400 (blocked)', badUpRes.status === 400);

  console.log('[ai diagnose stub]');
  const diag = await json('POST', `/api/export-diagnosis/${id}/diagnose`);
  check('POST :id/diagnose → 200 + score', diag.status === 200 && typeof diag.data.data.diagnosisResult.overallScore === 'number');

  console.log('[not found]');
  const nf = await json('GET', '/api/export-diagnosis/does-not-exist');
  check('GET unknown id → 404', nf.status === 404);

  console.log(`\n── Result: ${pass} passed, ${fail} failed ──\n`);
  process.exit(fail === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error('Smoke test crashed:', e);
  process.exit(1);
});
