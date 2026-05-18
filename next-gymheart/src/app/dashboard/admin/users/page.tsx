import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { UserRowActions, type AdminUserRecord } from "@/components/admin/user-row-actions";
import { RealtimeFilter } from "@/components/realtime-filter";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const roleStyle: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  coach: "bg-blue-100 text-blue-700",
  user: "bg-green-100 text-green-700",
};

const roleOptions = [
  { value: "", label: "Tất cả vai trò" },
  { value: "admin", label: "Admin" },
  { value: "coach", label: "Coach" },
  { value: "user", label: "User" },
];

type EnrollmentRow = {
  id: string;
  user_id: string;
  status: string;
  payment_status: string | null;
  courses: { course_name: string } | { course_name: string }[] | null;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function messageText(updated?: string, error?: string) {
  if (updated) return "Đã cập nhật người dùng thành công.";
  if (error === "self_delete") return "Không thể xóa tài khoản đang đăng nhập.";
  if (error === "self_status") return "Không thể tự vô hiệu hóa tài khoản đang đăng nhập.";
  if (error === "admin_delete") return "Không thể xóa tài khoản admin.";
  if (error === "image_invalid") return "Ảnh tải lên phải là file ảnh và dung lượng không quá 3MB.";
  if (error) return "Không thể xử lý yêu cầu. Kiểm tra dữ liệu rồi thử lại.";
  return null;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, email, phone, avatar_url, bio, role, requested_role, specialization, years_of_experience, certification, is_active, created_at")
    .order("created_at", { ascending: false });

  const users = (data || []) as AdminUserRecord[];
  const userIds = users.map((user) => user.id);
  const enrollmentsResult =
    userIds.length > 0
      ? await supabase
          .from("class_enrollments")
          .select("id, user_id, status, payment_status, courses(course_name)")
          .neq("status", "cancelled")
          .in("user_id", userIds)
      : { data: [] };
  const enrollments = (enrollmentsResult.data || []) as EnrollmentRow[];
  const enrollmentsByUser = new Map<string, EnrollmentRow[]>();

  enrollments.forEach((enrollment) => {
    const current = enrollmentsByUser.get(enrollment.user_id) || [];
    current.push(enrollment);
    enrollmentsByUser.set(enrollment.user_id, current);
  });

  const usersWithEnrollments = users.map((user) => ({
    ...user,
    enrollments: enrollmentsByUser.get(user.id) || [],
  }));
  const message = messageText(params.updated, params.error);

  return (
    <section className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black">Quản lý người dùng</h1>
          <p className="mt-2 text-sm text-muted">Xem, thêm, sửa, khóa hoặc xóa tài khoản học viên, admin và HLV.</p>
        </div>
        <AddUserDialog />
      </div>

      {message ? (
        <div className={`mb-5 rounded-lg px-4 py-3 text-sm font-bold ${params.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      ) : null}

      <RealtimeFilter
        className="mb-6"
        initialQuery={params.q || ""}
        initialSelect={params.role || ""}
        placeholder="Tìm kiếm người dùng theo tên, email hoặc vai trò..."
        scopeId="admin-users-table"
        selectDataKey="role"
        selectLabel="Vai trò"
        selectOptions={roleOptions}
      />

      <div className="overflow-x-auto rounded-xl border border-pink-100">
        <table className="w-full min-w-[1240px] text-left text-sm">
          <thead className="bg-primary-soft text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Khóa học</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Yêu cầu</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="w-[284px] px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-100" id="admin-users-table">
            {usersWithEnrollments.map((user) => {
              const enrollmentCourses = (user.enrollments || [])
                .map((enrollment) => one(enrollment.courses)?.course_name || "")
                .filter(Boolean);
              const courseSearch = enrollmentCourses.join(" ");
              const courseText =
                user.role === "user"
                  ? enrollmentCourses.length > 0
                    ? enrollmentCourses.join(", ")
                    : "Chưa đăng ký"
                  : "-";

              return (
              <tr
                className="hover:bg-primary-soft/60"
                data-filter-item
                data-role={user.role}
                data-search={`${user.full_name} ${user.email} ${user.phone || ""} ${user.role} ${user.requested_role || ""} ${courseSearch}`}
                key={user.id}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <div
                        className="flex size-10 items-center justify-center rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${user.avatar_url})` }}
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                        {initials(user.full_name)}
                      </div>
                    )}
                    <div>
                      <p className="font-black">{user.full_name}</p>
                      <p className="text-xs text-muted">{user.phone || "Chưa có SĐT"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted">{user.email}</td>
                <td className="px-4 py-4 text-muted">
                  <p className="line-clamp-2" title={courseText}>
                    {courseText}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${roleStyle[user.role] || roleStyle.user}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-4 text-muted">{user.requested_role || "-"}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${user.is_active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                    {user.is_active ? "Active" : "Đã khóa"}
                  </span>
                </td>
                <td className="w-[284px] px-4 py-4">
                  <UserRowActions user={user} mode="users" />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
