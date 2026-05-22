import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const adminItems = [
  { href: "/dashboard/admin", label: "Tổng quan", icon: "layout" },
  { href: "/dashboard/admin/courses", label: "Khóa học", icon: "graduation" },
  { href: "/dashboard/admin/users", label: "Người dùng", icon: "users" },
  { href: "/dashboard/admin/coaches", label: "Huấn luyện viên", icon: "dumbbell" },
  { href: "/dashboard/admin/enrollments", label: "Đăng ký", icon: "clipboard" },
  { href: "/dashboard/admin/schedules", label: "Lịch học", icon: "calendar" },
  { href: "/dashboard/admin/audit", label: "Nhật ký", icon: "history" },
  { href: "/dashboard/admin/check-in", label: "Check-in", icon: "scan" },
] as const;

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const { data: profile } = session
    ? await supabase.from("users").select("full_name, avatar_url").eq("id", session.userId).maybeSingle()
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
                  roleLabel: "Quản trị viên",
                  profileHref: "/profile",
                  logoutHref: "/logout",
                  avatarUrl: profile?.avatar_url || null,
                }
              : null
          }
          brand="Admin Panel"
          icon="heart"
          items={adminItems}
        />
        <main>{children}</main>
      </div>
    </>
  );
}
