// 온보딩 완료 여부 판정 (순수). onboarded_at 이 채워졌으면 완료.
export function isOnboarded(
  profile: { onboarded_at: string | null } | null
): boolean {
  return !!profile?.onboarded_at;
}
