import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";

const roleByDashboardPath = {
  "/dashboard/admin": "admin",
  "/dashboard/coach": "coach",
  "/dashboard/user": "user",
} as const;

const userOnlyPaths = ["/my-courses", "/schedule", "/cart"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionCookie(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  for (const [path, role] of Object.entries(roleByDashboardPath)) {
    if (pathname.startsWith(path) && session.role !== role) {
      return NextResponse.redirect(new URL(`/dashboard/${session.role}`, request.url));
    }
  }

  if (userOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    if (session.role !== "user") {
      return NextResponse.redirect(new URL(`/dashboard/${session.role}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/my-courses", "/schedule", "/profile", "/cart"],
};
