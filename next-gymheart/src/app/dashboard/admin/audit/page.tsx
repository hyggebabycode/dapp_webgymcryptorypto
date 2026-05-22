import { RealtimeFilter } from "@/components/realtime-filter";
import { compactAddress, formatDateTime } from "@/lib/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AuditLogRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  users: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
};

const actionLabels: Record<string, string> = {
  attendance_check_in: "Check-in học viên",
  approve_pt_request: "Duyệt yêu cầu PT",
  archive_course: "Ẩn khóa học",
  archive_enrollment: "Lưu trữ đăng ký",
  archive_user: "Vô hiệu hóa người dùng",
  coach_cancel_schedule: "HLV hủy lịch",
  coach_create_lesson_plan: "HLV thêm giáo án",
  coach_create_schedule: "HLV thêm lịch",
  coach_delete_lesson_plan: "HLV xóa giáo án",
  coach_remove_student_enrollment: "HLV hủy học viên",
  coach_update_lesson_plan: "HLV sửa giáo án",
  coach_update_schedule: "HLV sửa lịch",
  coach_update_student_progress: "HLV cập nhật tiến độ",
  create_coach: "Thêm HLV",
  create_course: "Thêm khóa học",
  create_pt_request: "Thêm yêu cầu PT",
  create_schedule: "Thêm lịch học",
  create_user: "Thêm người dùng",
  deactivate_user: "Vô hiệu hóa người dùng",
  delete_course: "Xóa khóa học",
  hide_course: "Ẩn khóa học",
  record_web3_payment: "Ghi nhận thanh toán MetaMask",
  reject_pt_request: "Từ chối yêu cầu PT",
  show_course: "Mở khóa học",
  update_course: "Sửa khóa học",
  update_enrollment_status: "Cập nhật đăng ký",
  update_schedule: "Sửa lịch học",
  update_user: "Sửa người dùng",
};

const entityLabels: Record<string, string> = {
  attendance_checkin: "Điểm danh",
  course: "Khóa học",
  enrollment: "Đăng ký",
  lesson_plan: "Giáo án",
  payment: "Thanh toán",
  pt_request: "Yêu cầu PT",
  schedule: "Lịch học",
  user: "Người dùng",
};

const detailLabels: Record<string, string> = {
  coachId: "HLV",
  courseId: "Khóa học",
  courseName: "Tên khóa học",
  dayOfWeek: "Thứ",
  durationWeeks: "Thời lượng",
  email: "Email",
  endTime: "Giờ kết thúc",
  fullName: "Họ tên",
  isActive: "Trạng thái",
  lessonTitle: "Bài học",
  level: "Cấp độ",
  maxStudents: "Sĩ số tối đa",
  paymentStatus: "Thanh toán",
  price: "Học phí",
  progress: "Tiến độ",
  role: "Vai trò",
  startTime: "Giờ bắt đầu",
  status: "Tình trạng",
  title: "Tiêu đề",
  tokenAmount: "Số tiền",
  txHash: "Mã giao dịch",
  walletAddress: "Ví thanh toán",
  weekNumber: "Tuần",
};

const dayLabels: Record<string, string> = {
  "0": "Chủ nhật",
  "1": "Thứ hai",
  "2": "Thứ ba",
  "3": "Thứ tư",
  "4": "Thứ năm",
  "5": "Thứ sáu",
  "6": "Thứ bảy",
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDetailValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (key === "isActive") return value ? "Đang mở" : "Đã ẩn";
  if (key === "dayOfWeek") return dayLabels[String(value)] || String(value);
  if (key === "durationWeeks") return `${value} tuần`;
  if (key === "price") return `${Number(value).toLocaleString("vi-VN")} TEST`;
  if (key === "tokenAmount") return `${value} TEST`;
  if (key === "txHash" || key === "walletAddress") return compactAddress(String(value));
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}

function detailText(details: Record<string, unknown> | null) {
  if (!details || Object.keys(details).length === 0) return "-";

  return Object.entries(details)
    .slice(0, 5)
    .map(([key, value]) => {
      const label = detailLabels[key] || key;
      return `${label}: ${formatDetailValue(key, value)}`;
    })
    .join(" · ");
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, details, created_at, users(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(120);

  const logs = (data || []) as AuditLogRow[];

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm" id="admin-audit-page">
      <div className="mb-5">
        <h1 className="text-3xl font-black">Nhật ký thao tác</h1>
        <p className="mt-2 text-sm text-muted">
          Theo dõi các thay đổi quan trọng trong hệ thống: thanh toán, khóa học, lịch học,
          người dùng và đăng ký.
        </p>
      </div>

      <RealtimeFilter
        className="mb-6"
        initialQuery={params.q || ""}
        placeholder="Tìm theo người thao tác, hành động, đối tượng hoặc chi tiết..."
        scopeId="admin-audit-page"
      />

      <div className="overflow-x-auto rounded-2xl border border-pink-100">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-primary-soft text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Người thao tác</th>
              <th className="px-4 py-3">Hành động</th>
              <th className="px-4 py-3">Đối tượng</th>
              <th className="px-4 py-3">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-100">
            {logs.length > 0 ? (
              logs.map((log) => {
                const actor = one(log.users);
                const label = actionLabels[log.action] || log.action;
                const entity = entityLabels[log.entity_type] || log.entity_type;
                const details = detailText(log.details);

                return (
                  <tr
                    className="hover:bg-primary-soft/60"
                    data-filter-item
                    data-search={`${actor?.full_name || ""} ${actor?.email || ""} ${label} ${log.action} ${entity} ${log.entity_type} ${log.entity_id || ""} ${details}`}
                    key={log.id}
                  >
                    <td className="px-4 py-4 font-bold">{formatDateTime(log.created_at)}</td>
                    <td className="px-4 py-4">
                      <p className="font-black">{actor?.full_name || "Hệ thống"}</p>
                      <p className="text-xs text-muted">{actor?.email || "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-black text-primary">
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {entity}
                      {log.entity_id ? <span className="block font-mono text-xs">{log.entity_id}</span> : null}
                    </td>
                    <td className="px-4 py-4 text-muted">{details}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-8 text-center font-bold text-muted" colSpan={5}>
                  Chưa có thao tác nào được ghi nhận.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
