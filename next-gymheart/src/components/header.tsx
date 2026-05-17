import Link from "next/link";
import { Heart, LogOut, Search } from "lucide-react";
import { CartButton } from "@/components/cart/cart-button";
import { NotificationButton } from "@/components/notification-button";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionPayload } from "@/lib/auth/session";

const dashboardHrefByRole = {
  admin: "/dashboard/admin",
  coach: "/dashboard/coach",
  user: "/dashboard/user",
} as const;

const publicNavItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/facilities", label: "Cơ sở vật chất" },
  { href: "/coaches", label: "HLV" },
  { href: "/services", label: "Dịch vụ" },
  { href: "/#community", label: "Cộng đồng" },
  { href: "/#contact", label: "Liên hệ" },
];

const userNavItems = [
  { href: "/", label: "Trang chủ" },
  { href: "dashboard", label: "Bảng điều khiển" },
  { href: "/courses", label: "Khóa học" },
  { href: "/my-courses", label: "Khóa của tôi" },
  { href: "/schedule", label: "Lịch tập" },
  { href: "/profile", label: "Hồ sơ" },
];

const navItemsByRole = {
  admin: [{ href: "dashboard", label: "Bảng điều khiển" }],
  coach: [
    { href: "dashboard", label: "Bảng điều khiển" },
    { href: "/dashboard/coach/courses", label: "Khóa phụ trách" },
    { href: "/dashboard/coach/schedule", label: "Lịch dạy" },
    { href: "/profile", label: "Hồ sơ" },
  ],
  user: userNavItems,
} as const;

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

export function Header({ session }: { session: SessionPayload | null }) {
  const dashboardHref = session ? dashboardHrefByRole[session.role] : "/login";
  const navItems = session ? navItemsByRole[session.role] : publicNavItems;
  const showMemberActions = session?.role === "user";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-soft bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Heart className="fill-primary text-primary" size={30} />
          <span className="whitespace-nowrap text-2xl font-black tracking-tight text-primary">
            GymHeart
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-3 text-sm font-bold text-[#5c3d44] xl:flex 2xl:gap-5">
          {navItems.map((item) => {
            const href = item.href === "dashboard" ? dashboardHref : item.href;
            return (
              <Link
                className="whitespace-nowrap rounded-md px-2 py-2 hover:bg-primary-soft hover:text-primary"
                href={href}
                key={`${href}-${item.label}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {session ? (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {showMemberActions ? (
              <>
                <form action="/courses" className="relative hidden lg:block">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300"
                size={18}
              />
              <input
                className="h-10 w-52 rounded-full bg-primary-soft pl-11 pr-4 text-sm font-bold outline-none placeholder:text-pink-300 2xl:w-72"
                name="search"
                placeholder="Tìm kiếm khóa học..."
              />
            </form>
            <NotificationButton />
                <CartButton isAuthenticated />
              </>
            ) : null}
            <Link
              className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-sm font-black text-white ring-2 ring-white"
              href="/profile"
              title="Chỉnh sửa hồ sơ"
            >
              {getInitials(session.fullName)}
            </Link>
            <form action={logoutAction}>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-soft px-4 text-sm font-black text-primary hover:bg-[#ffe1e9]"
                type="submit"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </form>
          </div>
        ) : (
          <Link
            className="ml-auto inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-black text-white hover:opacity-90"
            href="/login"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
