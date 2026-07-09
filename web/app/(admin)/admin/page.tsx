import { requireAdmin } from "@/lib/auth/requireAdmin";
import { signOut } from "@/app/auth/actions";

export default async function AdminHome() {
  await requireAdmin(); // 관리자 아니면 /login 으로 redirect

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>BridgeX 관리자</h1>
      <p>관리자 게이트 통과. 백오피스는 P4에서 구현.</p>
      <form action={signOut}>
        <button type="submit">로그아웃</button>
      </form>
    </main>
  );
}
