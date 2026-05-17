"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Dumbbell,
  GraduationCap,
  Heart,
  History,
  LayoutDashboard,
  LogOut,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

const iconMap = {
  calendar: CalendarDays,
  clipboard: ClipboardList,
  dumbbell: Dumbbell,
  graduation: GraduationCap,
  heart: Heart,
  history: History,
  layout: LayoutDashboard,
  user: UserRound,
  users: Users,
} satisfies Record<string, LucideIcon>;

export type DashboardIconName = keyof typeof iconMap;

export type DashboardSidebarItem = {
  href: string;
  label: string;
  icon: DashboardIconName;
};

type SidebarAccount = {
  fullName: string;
  roleLabel: string;
  profileHref: string;
  logoutHref: string;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AD"
  );
}

export function DashboardSidebar({
  brand,
  icon,
  items,
  account,
}: {
  brand: string;
  icon: DashboardIconName;
  items: readonly DashboardSidebarItem[];
  account?: SidebarAccount | null;
}) {
  const pathname = usePathname();
  const BrandIcon = iconMap[icon];

  return (
    <aside className="flex h-fit min-h-[calc(100vh-3rem)] flex-col rounded-xl border border-pink-100 bg-white p-4 shadow-sm lg:sticky lg:top-6">
      <div>
        <div className="mb-5 flex items-center gap-2 px-2">
          <BrandIcon className="fill-primary text-primary" size={28} />
          <h2 className="text-xl font-black text-primary">{brand}</h2>
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const ItemIcon = iconMap[item.icon];
            const isRootDashboard =
              item.href === "/dashboard/admin" || item.href === "/dashboard/coach";
            const isActive =
              pathname === item.href ||
              (!isRootDashboard && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-[#5c3d44] hover:bg-primary-soft hover:text-primary"
                }`}
                href={item.href}
                key={item.href}
              >
                <ItemIcon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {account ? (
        <div className="mt-auto border-t border-pink-100 pt-4">
          <Link className="flex items-center gap-3 rounded-lg p-2 hover:bg-primary-soft" href={account.profileHref}>
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
              {initials(account.fullName)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">{account.fullName}</span>
              <span className="block text-xs font-bold text-muted">{account.roleLabel}</span>
            </span>
          </Link>
          <Link
            className="mt-3 flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-soft text-sm font-black text-primary hover:bg-[#ffe1e9]"
            href={account.logoutHref}
          >
            <LogOut size={16} />
            Đăng xuất
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
