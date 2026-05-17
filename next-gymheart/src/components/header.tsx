import Link from "next/link";
import { Heart, LogOut, Search } from "lucide-react";
import { CartButton } from "@/components/cart/cart-button";
import { MemberAccountMenu } from "@/components/member-account-menu";
import { NotificationButton, type NotificationItem } from "@/components/notification-button";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionPayload } from "@/lib/auth/session";
import { compactAddress, paymentAmountToTest } from "@/lib/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

type MemberInfo = {
  fullName: string;
  role: string;
  walletAddress: string | null;
  requestedRole: string | null;
  ptRequestStatus: string | null;
};

type PaidEnrollment = {
  id: string;
  payment_amount: number | null;
  payment_token_amount?: number | null;
  payment_date?: string | null;
  courses: { course_name: string } | { course_name: string }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

async function getMemberHeaderData(session: SessionPayload | null) {
  if (!session) return { member: null, notifications: [] as NotificationItem[] };

  const supabase = await createSupabaseServerClient();
  const [userResult, paidResult] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, role, wallet_address, requested_role, pt_request_status")
      .eq("id", session.userId)
      .maybeSingle(),
    supabase
      .from("class_enrollments")
      .select("id, payment_amount, payment_token_amount, payment_date, courses(course_name)")
      .eq("user_id", session.userId)
      .eq("payment_status", "paid")
      .order("payment_date", { ascending: false })
      .limit(3),
  ]);

  const user = userResult.data;
  const member: MemberInfo = {
    fullName: user?.full_name || session.fullName,
    role: user?.role || session.role,
    walletAddress: (user?.wallet_address as string | null) || null,
    requestedRole: (user?.requested_role as string | null) || null,
    ptRequestStatus: (user?.pt_request_status as string | null) || null,
  };

  const notifications: NotificationItem[] = [];
  if (member.walletAddress) {
    notifications.push({
      id: "wallet-linked",
      title: "Đã liên kết ví",
      message: `Ví MetaMask ${compactAddress(member.walletAddress)} đang được dùng cho thanh toán.`,
    });
  }

  if (member.role === "coach" || member.ptRequestStatus === "approved") {
    notifications.push({
      id: "pt-approved",
      title: "Đã được duyệt HLV",
      message: "Tài khoản của bạn đã có quyền huấn luyện viên.",
    });
  } else if (member.requestedRole === "coach" || member.ptRequestStatus === "pending") {
    notifications.push({
      id: "pt-pending",
      title: "Đã xác nhận đăng ký HLV",
      message: "Hồ sơ đăng ký HLV của bạn đã được gửi và đang chờ admin duyệt.",
    });
  }

  const paidEnrollments = (paidResult.data || []) as PaidEnrollment[];
  for (const enrollment of paidEnrollments) {
    const course = one(enrollment.courses);
    notifications.push({
      id: `payment-${enrollment.id}`,
      title: "Thanh toán thành công",
      message: `${course?.course_name || "Khóa học"} đã được mở khóa với ${paymentAmountToTest({
        baseAmount: enrollment.payment_amount,
        tokenAmount: enrollment.payment_token_amount,
      })}.`,
    });
  }

  return { member, notifications };
}

export async function Header({ session }: { session: SessionPayload | null }) {
  const { member, notifications } = await getMemberHeaderData(session);
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
            <NotificationButton notifications={notifications} />
                <CartButton isAuthenticated />
              </>
            ) : null}
            {!showMemberActions ? <NotificationButton notifications={notifications} /> : null}
            {member ? <MemberAccountMenu member={member} /> : null}
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
