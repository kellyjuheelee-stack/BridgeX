import { redirect } from "next/navigation";
import { getAccess } from "@/lib/auth/getAccess";

export async function requireAdmin(): Promise<void> {
  const { access } = await getAccess();
  if (access !== "admin") redirect("/login");
}
