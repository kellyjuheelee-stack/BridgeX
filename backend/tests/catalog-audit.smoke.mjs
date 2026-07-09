// 카탈로그 점검 엔드투엔드 smoke: `npm run smoke:catalog`
const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
let pass = 0, fail = 0;
function check(n, c, e = '') { if (c) { pass++; console.log(`  ✅ ${n}`); } else { fail++; console.log(`  ❌ ${n} ${e}`); } }
async function json(method, path, body, token) {
  const h = {}; if (body) h['Content-Type'] = 'application/json'; if (token) h.Authorization = 'Bearer ' + token;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}
async function run() {
  console.log(`\n▶ Catalog-audit smoke against ${BASE}\n`);
  const stamp = Date.now();
  const reg = await json('POST', '/api/members', { name: '점검', companyName: '점검코스메틱', email: `catalog+${stamp}@test.com`, phone: '010-0000-0000', password: 'catalogpass1' });
  check('회원가입 → 201', reg.status === 201 && !!reg.data.data.token, `(${reg.status})`);
  const token = reg.data?.data?.token;

  const noAuth = await json('POST', '/api/members/me/catalog-audit', { text: '미백' });
  check('토큰 없음 → 401', noAuth.status === 401, `(${noAuth.status})`);

  const empty = await json('POST', '/api/members/me/catalog-audit', { text: '   ' }, token);
  check('빈 문구 → 400', empty.status === 400, `(${empty.status})`);

  const res = await json('POST', '/api/members/me/catalog-audit', { text: '이 제품은 미백과 여드름 치료에 좋습니다. INCI 제공.' }, token);
  check('점검 → 200', res.status === 200, `(${res.status})`);
  const keys = (res.data.data?.findings || []).map((f) => f.key);
  check('미백 감지', keys.includes('whitening'));
  check('치료 감지', keys.includes('medicinal'));
  check('INCI 바이어레디 present', (res.data.data?.buyerReady || []).some((b) => b.item === 'INCI 전성분' && b.present));
  check('면책 문구 포함', /법률 자문/.test(res.data.data?.disclaimer || ''));
  check('diagnosisId 키 존재(null 가능)', res.data.data && 'diagnosisId' in res.data.data);

  console.log(`\n── Result: ${pass} passed, ${fail} failed ──\n`);
  process.exit(fail === 0 ? 0 : 1);
}
run().catch((e) => { console.error('crashed:', e); process.exit(1); });
