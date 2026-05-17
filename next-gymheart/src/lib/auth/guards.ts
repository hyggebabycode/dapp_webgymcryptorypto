import { redirect } from "next/navigation";
import { getSession, type SessionPayload, type UserRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireActiveSession(next = "/dashboard/user") {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, is_active")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !user || !user.is_active) {
    redirect("/login?error=inactive");
  }

  return {
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role as UserRole,
    expiresAt: session.expiresAt,
  } satisfies SessionPayload;
}

export async function requireRole(role: UserRole, next: string) {
  const session = await requireActiveSession(next);
  if (session.role !== role) {
    redirect(`/dashboard/${session.role}`);
  }

  return session;
}
