import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import {
  createSessionCookie,
  SESSION_COOKIE_NAME,
  type UserRole,
} from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const dashboardHrefByRole: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  coach: "/dashboard/coach",
  user: "/dashboard/user",
};

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nextPath = String(formData.get("next") || "");

  if (!email || !password) {
    return redirectTo(request, "/login?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, password_hash, full_name, role, is_active")
    .eq("email", email)
    .limit(1);

  if (error || !users || users.length === 0) {
    return redirectTo(request, "/login?error=invalid");
  }

  const user = users[0];
  if (!user.is_active) {
    return redirectTo(request, "/login?error=inactive");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return redirectTo(request, "/login?error=invalid");
  }

  const role = user.role as UserRole;
  const response = redirectTo(
    request,
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : dashboardHrefByRole[role],
  );
  const cookieValue = await createSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role,
  });

  response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });

  return response;
}
