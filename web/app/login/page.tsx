import { signIn } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 360 }}>
      <h1>로그인</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <form action={signIn} style={{ display: "grid", gap: 8 }}>
        <input name="email" type="email" placeholder="이메일" required />
        <input name="password" type="password" placeholder="비밀번호" required />
        <button type="submit">로그인</button>
      </form>
      <p>
        계정이 없나요? <a href="/signup">회원가입</a>
      </p>
    </main>
  );
}
