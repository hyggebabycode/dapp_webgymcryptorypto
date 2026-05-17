import Link from "next/link";
import { Dumbbell, GraduationCap, ReceiptText, Search, Users, WalletCards } from "lucide-react";
import { AdminOverviewActions } from "@/components/admin/admin-overview-actions";
import { baseAmountToTest, compactAddress, formatDateTime, formatTestAmount } from "@/lib/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RangeKey = "7d" | "30d" | "quarter";
type RevenueSortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

type UserRow = {
  id: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  requested_role?: string | null;
};

type CourseRow = {
  id: string;
  course_name: string;
  current_students: number;
  max_students: number;
  is_active: boolean;
  created_at?: string;
};

type EnrollmentRow = {
  id: string;
  status: string;
  payment_status: string | null;
  payment_amount: number | null;
  payment_token_amount?: number | null;
  payment_currency?: string | null;
  payment_method?: string | null;
  payment_date?: string | null;
  payer_wallet?: string | null;
  tx_hash?: string | null;
  enrollment_date?: string;
  users: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  courses: { course_name: string } | { course_name: string }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function getRange(range?: string) {
  const now = new Date();
  const activeRange: RangeKey = range === "7d" || range === "quarter" ? range : "30d";
  const start = new Date(now);

  if (activeRange === "7d") {
    start.setDate(now.getDate() - 7);
  } else if (activeRange === "quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(now.getDate() - 30);
  }

  const label =
    activeRange === "7d"
      ? "7 ngày gần nhất"
      : activeRange === "quarter"
        ? "Quý hiện tại"
        : "30 ngày gần nhất";

  return { activeRange, label, start };
}

function getRevenueSort(sort?: string): RevenueSortKey {
  if (sort === "date_asc" || sort === "amount_desc" || sort === "amount_asc") return sort;
  return "date_desc";
}

function adminOverviewHref(range: RangeKey, revenueSort: RevenueSortKey) {
  const params = new URLSearchParams({ range, revenueSort });
  return `/dashboard/admin?${params.toString()}#revenue-history`;
}

const revenueSortOptions: Array<{ key: RevenueSortKey; label: string }> = [
  { key: "date_desc", label: "Ngày mới nhất" },
  { key: "date_asc", label: "Ngày cũ nhất" },
  { key: "amount_desc", label: "TEST cao nhất" },
  { key: "amount_asc", label: "TEST thấp nhất" },
];

function inRange(value: string | undefined, start: Date) {
  if (!value) return false;
  return new Date(value).getTime() >= start.getTime();
}

function paymentTestValue(item: EnrollmentRow) {
  const tokenAmount = Number(item.payment_token_amount || 0);
  if (Number.isFinite(tokenAmount) && tokenAmount > 0) return tokenAmount;
  return baseAmountToTest(item.payment_amount);
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; range?: string; revenueSort?: string }>;
}) {
  const params = await searchParams;
  const { activeRange, label: rangeLabel, start } = getRange(params.range);
  const revenueSort = getRevenueSort(params.revenueSort);
  const supabase = await createSupabaseServerClient();
  const [usersResult, coursesResult, enrollmentsWithWeb3Result] = await Promise.all([
    supabase
      .from("users")
      .select("id, role, is_active, requested_role, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("courses")
      .select("id, course_name, current_students, max_students, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("class_enrollments")
      .select("id, status, payment_status, payment_amount, payment_token_amount, payment_currency, payment_method, payment_date, payer_wallet, tx_hash, enrollment_date, users(full_name, email), courses(course_name)")
      .order("enrollment_date", { ascending: false }),
  ]);
  let enrollmentsData = enrollmentsWithWeb3Result.data as EnrollmentRow[] | null;
  if (enrollmentsWithWeb3Result.error) {
    const fallbackResult = await supabase
      .from("class_enrollments")
      .select("id, status, payment_status, payment_amount, payment_method, payment_date, enrollment_date, users(full_name, email), courses(course_name)")
      .order("enrollment_date", { ascending: false });
    enrollmentsData = fallbackResult.data as EnrollmentRow[] | null;
  }

  const users = (usersResult.data || []) as UserRow[];
  const courses = (coursesResult.data || []) as CourseRow[];
  const enrollments = enrollmentsData || [];
  const periodUsers = users.filter((user) => inRange(user.created_at, start));
  const periodEnrollments = enrollments.filter((item) => inRange(item.enrollment_date, start));
  const coaches = users.filter((user) => user.role === "coach");
  const ptRequests = users.filter((user) => user.requested_role === "coach" && user.role !== "coach");
  const activeCourses = courses.filter((course) => course.is_active);
  const revenueTest = periodEnrollments
    .filter((item) => item.payment_status === "paid")
    .reduce((sum, item) => sum + paymentTestValue(item), 0);
  const paidPeriodEnrollments = enrollments.filter((item) => {
    const paidAt = item.payment_date || item.enrollment_date;
    return item.payment_status === "paid" && inRange(paidAt, start);
  });
  const paymentHistory = [...paidPeriodEnrollments]
    .sort((left, right) => {
      if (revenueSort === "amount_desc" || revenueSort === "amount_asc") {
        const diff = paymentTestValue(left) - paymentTestValue(right);
        return revenueSort === "amount_desc" ? -diff : diff;
      }

      const leftTime = new Date(left.payment_date || left.enrollment_date || 0).getTime();
      const rightTime = new Date(right.payment_date || right.enrollment_date || 0).getTime();
      return revenueSort === "date_asc" ? leftTime - rightTime : rightTime - leftTime;
    })
    .slice(0, 12);
  const occupancy =
    activeCourses.length > 0
      ? Math.round(
          activeCourses.reduce((total, course) => {
            const max = Number(course.max_students || 1);
            return total + (Number(course.current_students || 0) / max) * 100;
          }, 0) / activeCourses.length,
        )
      : 0;

  const stats = [
    {
      label: "Tổng người dùng",
      value: users.length,
      icon: Users,
      badge: `+${periodUsers.length}`,
      href: "/dashboard/admin/users",
    },
    {
      label: "Khóa học",
      value: courses.length,
      icon: GraduationCap,
      badge: `${activeCourses.length} mở`,
      href: "/dashboard/admin/courses",
    },
    {
      label: "Huấn luyện viên",
      value: coaches.length,
      icon: Dumbbell,
      badge: "Team",
      href: "/dashboard/admin/coaches",
    },
    {
      label: "Doanh thu",
      value: formatTestAmount(revenueTest),
      icon: ReceiptText,
      badge: rangeLabel,
      href: "/dashboard/admin/enrollments",
    },
  ];

  const summary = [
    {
      label: "Yêu cầu chờ duyệt",
      value: ptRequests.length,
      badge: "PT",
      href: "/dashboard/admin/enrollments#pt-requests",
    },
    {
      label: "Khóa học đang mở",
      value: activeCourses.length,
      badge: "Active",
      href: "/dashboard/admin/courses?status=active",
    },
    {
      label: "Tỷ lệ lấp đầy",
      value: `${occupancy}%`,
      badge: "Capacity",
      href: "/dashboard/admin/schedules",
    },
    {
      label: "Đăng ký chờ xử lý",
      value: enrollments.filter((item) => item.status === "pending").length,
      badge: "Pending",
      href: "/dashboard/admin/enrollments",
    },
  ];

  const csvRows = periodEnrollments.map((item) => {
    const user = one(item.users);
    const course = one(item.courses);
    return {
      Loai: "Dang ky khoa hoc",
      Ten: user?.full_name || "",
      Email: user?.email || "",
      Khoa_hoc: course?.course_name || "",
      Trang_thai: item.status,
      Thanh_toan: item.payment_status || "pending",
      So_TEST: paymentTestValue(item),
      Vi: item.payer_wallet || "",
      Ma_giao_dich: item.tx_hash || "",
      Ngay: item.enrollment_date || "",
    };
  });

  const alerts = [
    ptRequests.length > 0 ? `${ptRequests.length} yêu cầu đăng ký làm PT đang chờ duyệt.` : null,
    enrollments.some((item) => item.status === "pending") ? "Có đăng ký khóa học đang chờ xử lý." : null,
    activeCourses.some((course) => Number(course.current_students || 0) >= Number(course.max_students || 0))
      ? "Có khóa học đã đạt sức chứa tối đa."
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <h1 className="text-3xl font-black">Tổng Quan Hệ Thống</h1>
            <p className="mt-2 text-sm text-muted">
              Thống kê và quản lý toàn bộ hệ thống GymHeart theo {rangeLabel.toLowerCase()}.
            </p>
          </div>
          <AdminOverviewActions
            activeRange={activeRange}
            csvRows={csvRows}
            report={{
              title: "Báo cáo quản trị GymHeart",
              rangeLabel,
              generatedAt: new Date().toLocaleString("vi-VN"),
              stats: [...stats, ...summary].map((item) => ({
                label: item.label,
                value: item.value,
              })),
              alerts: alerts.length > 0 ? alerts : ["Không có cảnh báo quan trọng trong thời điểm hiện tại."],
            }}
          />
        </div>

        <form action="/dashboard/admin/users" className="mb-6 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" size={18} />
            <input
              className="h-11 w-full rounded-lg border border-pink-100 bg-white pl-11 pr-4 text-sm outline-none focus:border-primary"
              defaultValue={params.q || ""}
              name="q"
              placeholder="Tìm người dùng, khóa học, đăng ký..."
            />
          </label>
        </form>

        <div className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link
              className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              href={stat.href}
              key={stat.label}
            >
              <div className="mb-4 flex items-center justify-between">
                <stat.icon className="text-primary" size={30} />
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-black text-green-700">
                  {stat.badge}
                </span>
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <Link
              className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              href={item.href}
              key={item.label}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wide text-muted">{item.label}</p>
                <span className="rounded-full bg-primary-soft px-2 py-1 text-xs font-black text-primary">
                  {item.badge}
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-primary">{item.value}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm" id="revenue-history">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <WalletCards className="text-primary" size={24} />
              Lịch sử nhận tiền MetaMask
            </h2>
            <p className="mt-2 text-sm text-muted">
              Theo dõi khoản thanh toán bằng TEST, ví thanh toán và mã giao dịch on-chain.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {revenueSortOptions.map((option) => (
                <Link
                  className={`inline-flex h-10 min-w-[124px] items-center justify-center rounded-lg border px-3 text-xs font-black transition ${
                    revenueSort === option.key
                      ? "border-primary bg-primary text-white"
                      : "border-pink-100 bg-white text-muted hover:border-primary hover:text-primary"
                  }`}
                  href={adminOverviewHref(activeRange, option.key)}
                  key={option.key}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <Link className="inline-flex h-10 min-w-[116px] items-center justify-center rounded-lg border border-primary px-4 text-sm font-black text-primary hover:bg-primary hover:text-white" href="/dashboard/admin/enrollments">
              Xem tất cả
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-pink-100">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="bg-primary-soft text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Ngày nhận</th>
                <th className="px-4 py-3">Học viên</th>
                <th className="px-4 py-3">Khóa học</th>
                <th className="px-4 py-3">Số TEST</th>
                <th className="px-4 py-3">Ví</th>
                <th className="px-4 py-3">Mã giao dịch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {paymentHistory.length > 0 ? (
                paymentHistory.map((item) => {
                  const user = one(item.users);
                  const course = one(item.courses);
                  return (
                    <tr className="hover:bg-primary-soft/60" key={item.id}>
                      <td className="px-4 py-4 font-bold">{formatDateTime(item.payment_date || item.enrollment_date)}</td>
                      <td className="px-4 py-4">
                        <p className="font-black">{user?.full_name || "Học viên"}</p>
                        <p className="text-xs text-muted">{user?.email || "-"}</p>
                      </td>
                      <td className="px-4 py-4 text-muted">{course?.course_name || "Khóa học"}</td>
                      <td className="px-4 py-4 font-black text-primary">{formatTestAmount(paymentTestValue(item))}</td>
                      <td className="px-4 py-4 font-mono text-xs text-muted" title={item.payer_wallet || ""}>
                        {compactAddress(item.payer_wallet)}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-muted" title={item.tx_hash || ""}>
                        {compactAddress(item.tx_hash, 10, 8)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-bold text-muted" colSpan={6}>
                    Chưa có giao dịch MetaMask được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col justify-between gap-2 rounded-xl bg-primary-soft px-4 py-3 text-sm font-bold text-muted sm:flex-row sm:items-center">
          <span>{paymentHistory.length} giao dịch trong bảng theo {rangeLabel.toLowerCase()}.</span>
          <span className="text-primary">Tổng kỳ này: {formatTestAmount(revenueTest)}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">Cảnh Báo Vận Hành</h2>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-black text-primary">
            Ưu tiên xử lý
          </span>
        </div>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Link
                className="block rounded-xl bg-yellow-50 px-4 py-4 text-sm font-bold text-yellow-800 hover:bg-yellow-100"
                href="/dashboard/admin/enrollments"
                key={alert}
              >
                {alert}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-green-50 px-4 py-4 text-sm font-bold text-green-700">
            Không có cảnh báo quan trọng trong thời điểm hiện tại.
          </div>
        )}
      </section>
    </div>
  );
}
