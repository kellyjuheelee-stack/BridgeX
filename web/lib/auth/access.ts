export type Access = "admin" | "member" | "anon";

export function resolveAccess(
  user: { id: string } | null,
  profile: { is_admin: boolean } | null
): Access {
  if (!user) return "anon";
  if (profile?.is_admin) return "admin";
  return "member";
}
