// 개인정보처리방침 — 레거시 privacy.html 콘텐츠 이식.
// 정적 서버 컴포넌트(/privacy). 회원가입·진단 동의 체크박스, 랜딩 푸터에서 링크됨.
// 〈…〉 placeholder 는 사업자/법률 검토용 — 실제 값으로 채우지 말 것(런칭 블로커).
import type { Metadata } from "next";
import styles from "./legal.module.css";

export const metadata: Metadata = {
  title: "개인정보처리방침 — BridgeX",
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a href="/" className={styles.logo}>
          Bridge<span>X</span>
        </a>
        <a href="/" className={styles.navHome} aria-label="홈으로">
          홈
        </a>
      </nav>
      <div className={styles.wrap}>
        <h1 className={styles.title}>개인정보처리방침</h1>
        <div className={styles.updated}>시행일: 2026년 7월 9일</div>

        <div className={styles.intro}>
          BridgeX(이하 “회사”)는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을
          준수합니다. 본 방침은 회사가 제공하는 수출 가능성 진단 및 컨설팅 관련 서비스(이하 “서비스”) 이용
          과정에서 수집하는 개인정보의 항목·목적·보유기간과 이용자의 권리를 안내합니다.
        </div>

        <h2>1. 수집하는 개인정보 항목</h2>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th>구분</th>
              <th>수집 항목</th>
              <th>수집 시점</th>
            </tr>
            <tr>
              <td>회원가입</td>
              <td>이름, 회사명, 이메일 주소, 전화번호, 비밀번호</td>
              <td>회원가입 시</td>
            </tr>
            <tr>
              <td>수출 가능성 진단</td>
              <td>
                담당자명, 회사명, 직책(선택), 이메일, 전화번호, 홈페이지·판매채널 정보(선택), 제품·인증·수출목표
                등 진단 입력 정보, 첨부 자료
              </td>
              <td>진단 신청 시</td>
            </tr>
            <tr>
              <td>상담 신청</td>
              <td>위 진단 정보 및 상담 요청 내역</td>
              <td>상담 신청 시</td>
            </tr>
          </tbody>
        </table>

        <h2>2. 개인정보의 수집 및 이용 목적</h2>
        <ul>
          <li>수출 가능성 진단 결과의 산출 및 제공</li>
          <li>진단·상담·컨설팅 진행을 위한 연락 및 안내</li>
          <li>회원 식별, 서비스 이용 이력 관리, 결과 저장·재열람</li>
          <li>서비스 개선 및 이용자 문의 응대</li>
        </ul>

        <h2>3. 보유 및 이용 기간</h2>
        <p>
          수집한 개인정보는 수집·이용 목적이 달성되거나 회원 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에
          따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </p>

        <h2>4. 개인정보의 제3자 제공</h2>
        <p>
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 사전에 동의한 경우 또는
          법령에 따라 요구되는 경우에는 예외로 합니다.
        </p>

        <h2>5. 개인정보 처리의 위탁</h2>
        <p>
          서비스 운영에 필요한 경우 개인정보 처리를 외부에 위탁할 수 있으며, 위탁 시 수탁자와 처리 목적을 본
          방침을 통해 고지합니다. <span className={styles.fill}>〈현재 위탁 내역: 해당 시 기재〉</span>
        </p>

        <h2>6. 정보주체의 권리와 행사 방법</h2>
        <p>
          이용자는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리정지를 요구할 수 있으며, 아래 연락처로
          요청하시면 지체 없이 조치합니다.
        </p>

        <h2>7. 개인정보의 파기</h2>
        <p>
          보유기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기하며, 전자적 파일은 복구·재생이
          불가능한 방법으로 삭제합니다.
        </p>

        <h2>8. 개인정보 보호책임자 및 문의처</h2>
        <ul>
          <li>
            사업자명: <span className={styles.fill}>〈사업자/상호명 기재〉</span>
          </li>
          <li>
            개인정보 보호책임자: <span className={styles.fill}>〈성명·직책 기재〉</span>
          </li>
          <li>
            문의 이메일: <span className={styles.fill}>〈문의 이메일 기재〉</span>
          </li>
        </ul>

        <div className={styles.foot}>
          본 방침은 관련 법령 및 서비스 변경에 따라 개정될 수 있으며, 개정 시 본 페이지를 통해 공지합니다. ©
          2026 BridgeX
        </div>
      </div>
    </div>
  );
}
