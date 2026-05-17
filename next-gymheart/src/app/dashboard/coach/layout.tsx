import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getSession } from "@/lib/auth/session";

const coachItems = [
  { href: "/dashboard/coach", label: "Tổng quan", icon: "layout" },
  { href: "/dashboard/coach/students", label: "Học viên", icon: "users" },
  { href: "/dashboard/coach/schedule", label: "Lịch dạy", icon: "calendar" },
  { href: "/dashboard/coach/courses", label: "Khóa phụ trách", icon: "graduation" },
  { href: "/profile", label: "Hồ sơ cá nhân", icon: "user" },
] as const;

export default async function CoachDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

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
                  fullName: session.fullName,
                  roleLabel: "Huấn luyện viên",
                  profileHref: "/profile",
                  logoutHref: "/logout",
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
