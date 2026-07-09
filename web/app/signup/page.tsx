import { signUp } from "@/app/auth/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 360 }}>
      <h1>회원가입</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <form action={signUp} style={{ display: "grid", gap: 8 }}>
        <input name="name" placeholder="이름" required />
        <input name="company_name" placeholder="회사명" required />
        <input name="phone" placeholder="전화번호" required />
        <input name="email" type="email" placeholder="이메일" required />
        <input name="password" type="password" placeholder="비밀번호(6자 이상)" required />
        <button type="submit">가입</button>
      </form>
      <p>
        이미 계정이 있나요? <a href="/login">로그인</a>
      </p>
    </main>
  );
}
