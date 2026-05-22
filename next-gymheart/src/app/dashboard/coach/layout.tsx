import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const coachItems = [
  { href: "/dashboard/coach", label: "Tổng quan", icon: "layout" },
  { href: "/dashboard/coach/students", label: "Học viên", icon: "users" },
  { href: "/dashboard/coach/schedule", label: "Lịch dạy", icon: "calendar" },
  { href: "/dashboard/coach/courses", label: "Khóa phụ trách", icon: "graduation" },
  { href: "/profile", label: "Hồ sơ cá nhân", icon: "user" },
  { href: "/dashboard/coach/check-in", label: "Check-in", icon: "scan" },
] as const;

export default async function CoachDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const { data: profile } = session
    ? await supabase
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", session.userId)
        .maybeSingle()
    : { data: null };

  return (
    <>
      <style>
        {`
          body > header,
          body > footer {
            display: none !important;
          }
        `}
      </style>
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <DashboardSidebar
          account={
            session
              ? {
                  fullName: profile?.full_name || session.fullName,
                  roleLabel: "Huấn luyện viên",
                  profileHref: "/profile",
                  logoutHref: "/logout",
                  avatarUrl: profile?.avatar_url || null,
                }
              : null
          }
          brand="Coach Panel"
          icon="heart"
          items={coachItems}
        />
        <main>{children}</main>
      </div>
    </>
  );
}
