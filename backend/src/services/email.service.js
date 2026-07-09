const nodemailer = require('nodemailer');

// ── 트랜스포터 (지연 초기화 싱글턴) ──
// SMTP_HOST 미설정 시 jsonTransport 로 대체 → 실제 발송 없이 콘솔에 로그만 남긴다.
let _transporter;
function transporter() {
  if (_transporter) return _transporter;
  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: String(process.env.SMTP_SECURE) === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  } else {
    _transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return _transporter;
}

const isDev = () => !process.env.SMTP_HOST;
const FROM = () => process.env.MAIL_FROM || 'BridgeX <no-reply@bridgex.co>';

async function send(msg) {
  try {
    const info = await transporter().sendMail({ from: FROM(), ...msg });
    if (isDev()) {
      console.log(`\n📧 [email:dev] (실제 발송 안 함) → ${msg.to}`);
      console.log(`   제목: ${msg.subject}`);
    } else {
      console.log(`📧 [email] sent → ${msg.to} (${info.messageId})`);
    }
    return info;
  } catch (err) {
    console.error(`📧 [email:error] ${msg.to} — ${err.message}`);
    return null;
  }
}

// ── 공용 레이아웃 ──
function layout(title, bodyHtml) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f7;font-family:'Apple SD Gothic Neo',Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="font-size:22px;font-weight:800;color:#1d1d1f;margin-bottom:20px;">Bridge<span style="color:#0066cc;">X</span></div>
      <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <h1 style="font-size:20px;font-weight:800;color:#1d1d1f;margin:0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="font-size:12px;color:#9e9ea3;text-align:center;margin-top:20px;">© 2026 BridgeX · K뷰티 수출의 모든 실행을 대신합니다.</div>
    </div></body></html>`;
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function list(arr) { return (arr && arr.length ? arr.join(', ') : '-'); }

// ── 1. 신청자 확인 메일 ──
function userConfirmation(r) {
  const body = `
    <p style="font-size:15px;line-height:1.7;color:#1d1d1f;margin:0 0 16px;">
      ${esc(r.contactName)} 님, <b>${esc(r.companyName)}</b>의 수출 가능성 진단 요청이 정상적으로 접수되었습니다.
    </p>
    <p style="font-size:15px;line-height:1.7;color:#6e6e73;margin:0 0 20px;">
      담당자가 입력하신 내용을 검토한 뒤, 이 이메일로 진단 결과와 다음 단계를 안내드리겠습니다.
    </p>
    <div style="background:#f5f5f7;border-radius:12px;padding:16px 18px;font-size:14px;color:#1d1d1f;line-height:1.9;">
      <div><b>제품</b> : ${esc(r.productName)} (${esc(r.productCategory)})</div>
      <div><b>목표 국가</b> : ${esc(list(r.targetCountries))}</div>
      <div><b>접수번호</b> : ${esc(r.id)}</div>
    </div>`;
  return {
    to: r.email,
    subject: '[BridgeX] 수출 가능성 진단 요청이 접수되었습니다.',
    html: layout('진단 요청이 접수되었습니다', body),
    text: `${r.contactName} 님, ${r.companyName}의 수출 가능성 진단 요청이 접수되었습니다. 접수번호: ${r.id}`,
  };
}

// ── 2. 관리자 알림 메일 ──
function adminNotification(r) {
  const adminUrl = process.env.ADMIN_URL || '';
  const body = `
    <p style="font-size:15px;line-height:1.7;color:#1d1d1f;margin:0 0 16px;">새 수출 가능성 진단 요청이 접수되었습니다.</p>
    <div style="background:#f5f5f7;border-radius:12px;padding:16px 18px;font-size:14px;color:#1d1d1f;line-height:1.9;">
      <div><b>회사</b> : ${esc(r.companyName)}</div>
      <div><b>담당자</b> : ${esc(r.contactName)} / ${esc(r.email)} / ${esc(r.phone)}</div>
      <div><b>제품</b> : ${esc(r.productName)} (${esc(r.productCategory)})</div>
      <div><b>목표 국가</b> : ${esc(list(r.targetCountries))}</div>
      <div><b>가장 어려운 부분</b> : ${esc(list(r.painPoints))}</div>
    </div>
    ${adminUrl ? `<p style="margin:20px 0 0;"><a href="${esc(adminUrl)}" style="display:inline-block;background:#0071e3;color:#fff;font-weight:600;font-size:14px;padding:11px 22px;border-radius:999px;text-decoration:none;">관리자 페이지에서 확인 →</a></p>` : ''}`;
  return {
    to: process.env.ADMIN_NOTIFY_EMAIL || FROM(),
    subject: `[BridgeX] 새 진단 요청 · ${r.companyName}`,
    html: layout('새 진단 요청', body),
    text: `새 진단 요청: ${r.companyName} / ${r.contactName} / ${r.email}`,
  };
}

// ── 3. 진단 결과 안내 메일 (상태가 completed 로 변경 시) ──
function resultReady(r) {
  const score = r.diagnosisResult && typeof r.diagnosisResult.overallScore === 'number'
    ? `<div style="font-size:14px;color:#1d1d1f;margin:0 0 16px;">종합 준비도 점수: <b style="color:#0066cc;">${r.diagnosisResult.overallScore}점</b> (${esc(r.diagnosisResult.readinessLevel || '')})</div>` : '';
  const body = `
    <p style="font-size:15px;line-height:1.7;color:#1d1d1f;margin:0 0 16px;">
      ${esc(r.contactName)} 님, <b>${esc(r.companyName)}</b>의 수출 가능성 진단이 완료되었습니다.
    </p>
    ${score}
    <p style="font-size:15px;line-height:1.7;color:#6e6e73;margin:0;">
      자세한 진단 결과와 추천 다음 단계는 담당자가 별도로 안내드리겠습니다.
    </p>`;
  return {
    to: r.email,
    subject: '[BridgeX] 수출 가능성 진단 결과 안내',
    html: layout('진단 결과가 준비되었습니다', body),
    text: `${r.contactName} 님, ${r.companyName}의 수출 가능성 진단이 완료되었습니다.`,
  };
}

// ── 4. 상담 신청 (핫리드) — 관리자 알림 ──
function consultationAdmin(r) {
  const adminUrl = process.env.ADMIN_URL || '';
  const score = r.diagnosisResult && typeof r.diagnosisResult.overallScore === 'number' ? `${r.diagnosisResult.overallScore}점` : '-';
  const body = `
    <p style="font-size:15px;line-height:1.7;color:#1d1d1f;margin:0 0 16px;"><b style="color:#0066cc;">🔥 상담 신청(핫리드)</b>이 접수되었습니다.</p>
    <div style="background:#f5f5f7;border-radius:12px;padding:16px 18px;font-size:14px;color:#1d1d1f;line-height:1.9;">
      <div><b>회사</b> : ${esc(r.companyName)}</div>
      <div><b>담당자</b> : ${esc(r.contactName)} / ${esc(r.email)} / ${esc(r.phone)}</div>
      <div><b>제품</b> : ${esc(r.productName)}</div>
      <div><b>자동 진단 점수</b> : ${esc(score)}</div>
      <div><b>가장 어려운 부분</b> : ${esc(list(r.painPoints))}</div>
    </div>
    ${adminUrl ? `<p style="margin:20px 0 0;"><a href="${esc(adminUrl)}" style="display:inline-block;background:#0071e3;color:#fff;font-weight:600;font-size:14px;padding:11px 22px;border-radius:999px;text-decoration:none;">관리자에서 확인 →</a></p>` : ''}`;
  return { to: process.env.ADMIN_NOTIFY_EMAIL || FROM(), subject: `[BridgeX] 🔥 상담 신청 · ${r.companyName}`, html: layout('상담 신청 접수', body), text: `상담 신청: ${r.companyName} / ${r.contactName} / ${r.email}` };
}

// ── 5. 상담 신청 — 신청자 확인 ──
function consultationUser(r) {
  const body = `
    <p style="font-size:15px;line-height:1.7;color:#1d1d1f;margin:0 0 16px;">${esc(r.contactName)} 님, 상담 신청이 접수되었습니다.</p>
    <p style="font-size:15px;line-height:1.7;color:#6e6e73;margin:0;">담당 전문가가 <b>${esc(r.companyName)}</b>의 유럽 수출 전략(바이어 매칭·규제 대응·계약)을 검토한 뒤 1영업일 내 연락드리겠습니다.</p>`;
  return { to: r.email, subject: '[BridgeX] 상담 신청이 접수되었습니다.', html: layout('상담 신청이 접수되었습니다', body), text: `${r.contactName} 님, 상담 신청이 접수되었습니다.` };
}

// ── 외부 API ──
// 접수 시: 신청자 + 관리자 메일 (병렬, 실패해도 무시)
async function sendSubmissionEmails(r) {
  await Promise.allSettled([send(userConfirmation(r)), send(adminNotification(r))]);
}
async function sendResultReadyEmail(r) {
  await send(resultReady(r));
}
async function sendConsultationEmails(r) {
  await Promise.allSettled([send(consultationUser(r)), send(consultationAdmin(r))]);
}

module.exports = { sendSubmissionEmails, sendResultReadyEmail, sendConsultationEmails };
