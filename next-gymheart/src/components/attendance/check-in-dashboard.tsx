import { CheckCircle2, Clock, QrCode, Search, TriangleAlert } from "lucide-react";
import {
  checkInEnrollmentAction,
  getCheckInPreview,
  getTodayCheckIns,
} from "@/lib/attendance/actions";

const errorMessages: Record<string, string> = {
  forbidden: "HLV chỉ có thể check-in học viên thuộc khóa mình phụ trách.",
  invalid_token: "Mã check-in không hợp lệ hoặc đã bị sửa.",
  missing_token: "Vui lòng nhập hoặc quét mã check-in.",
  not_found: "Không tìm thấy đăng ký khóa học tương ứng.",
  not_paid: "Học viên chưa thanh toán hoặc đăng ký không còn hiệu lực.",
  save_failed: "Chưa lưu được check-in. Vui lòng thử lại.",
  schema_missing: "Database chưa có bảng attendance_checkins. Hãy chạy file sql/attendance_checkins.sql.",
  token_mismatch: "Mã check-in không khớp với thông tin đăng ký.",
};

const updatedMessages: Record<string, string> = {
  already: "Học viên đã check-in hôm nay.",
  checked_in: "Check-in thành công.",
};

function formatTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function messageText(updated?: string, error?: string) {
  if (updated) return updatedMessages[updated] || "Đã cập nhật check-in.";
  if (error) return errorMessages[error] || "Không xử lý được mã check-in.";
  return null;
}

export async function CheckInDashboard({
  error,
  token,
  updated,
}: {
  token?: string;
  updated?: string;
  error?: string;
}) {
  const [preview, todayRows] = await Promise.all([
    token ? getCheckInPreview(token) : Promise.resolve(null),
    getTodayCheckIns(),
  ]);
  const message = messageText(updated, error || (preview && !preview.ok ? preview.error : undefined));

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-black text-primary">
              <QrCode size={18} />
              QR Check-in
            </div>
            <h1 className="text-3xl font-black">Điểm danh học viên</h1>
            <p className="mt-2 text-sm font-bold text-muted">
              Quét QR của học viên bằng camera điện thoại hoặc dán mã vào ô bên dưới.
            </p>
          </div>
        </div>

        {message ? (
          <div
            className={`mt-5 flex items-start gap-3 rounded-lg px-4 py-3 text-sm font-bold ${
              error || (preview && !preview.ok)
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {error || (preview && !preview.ok) ? (
              <TriangleAlert className="shrink-0" size={18} />
            ) : (
              <CheckCircle2 className="shrink-0" size={18} />
            )}
            <span>{message}</span>
          </div>
        ) : null}

        <form action={checkInEnrollmentAction} className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <label>
            <span className="mb-2 block text-sm font-black">Mã check-in</span>
            <input
              className="h-12 w-full rounded-lg border border-pink-100 px-4 text-sm font-bold outline-none focus:border-primary"
              defaultValue={token || ""}
              name="token"
              placeholder="Dán mã hoặc URL QR check-in tại đây"
            />
          </label>
          <button
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-white"
            type="submit"
          >
            <Search size={17} />
            Check-in
          </button>
        </form>
      </div>

      {preview?.ok ? (
        <section className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-muted">Thông tin từ mã QR</p>
              <h2 className="mt-1 text-2xl font-black">
                {preview.student?.full_name || "Học viên"}
              </h2>
              <p className="mt-1 text-sm font-bold text-muted">
                {preview.student?.email || "Chưa có email"}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                preview.alreadyCheckedIn
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {preview.alreadyCheckedIn ? "Đã check-in hôm nay" : "Sẵn sàng check-in"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
            <Info label="Khóa học" value={preview.course?.course_name || "Khóa học"} />
            <Info label="Ngày check-in" value={preview.checkinDate} />
            <Info
              label="Lịch hôm nay"
              value={
                preview.schedule
                  ? `${preview.schedule.title} · ${String(preview.schedule.start_time).slice(0, 5)}-${String(preview.schedule.end_time).slice(0, 5)}`
                  : "Không có lịch hôm nay"
              }
            />
          </div>

          {preview.warning === "no_schedule_today" ? (
            <p className="mt-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-700">
              Khóa này không có lịch học hôm nay. Hệ thống vẫn cho phép check-in và ghi chú là ngoài lịch.
            </p>
          ) : null}

          {!preview.alreadyCheckedIn ? (
            <form action={checkInEnrollmentAction} className="mt-5">
              <input name="token" type="hidden" value={preview.token} />
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-black text-white"
                type="submit"
              >
                Xác nhận check-in
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="text-primary" size={20} />
          <h2 className="text-xl font-black">Check-in hôm nay</h2>
        </div>

        {todayRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-primary-soft text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Học viên</th>
                  <th className="px-4 py-3">Khóa học</th>
                  <th className="px-4 py-3">Giờ</th>
                  <th className="px-4 py-3">Phương thức</th>
                  <th className="px-4 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {todayRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <p className="font-black">{row.studentName}</p>
                      <p className="text-xs font-bold text-muted">{row.studentEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-bold">{row.courseName}</td>
                    <td className="px-4 py-3 font-bold">{formatTime(row.checkin_time)}</td>
                    <td className="px-4 py-3 font-bold uppercase text-primary">
                      {row.method || "qr"}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg bg-background px-4 py-8 text-center text-sm font-bold text-muted">
            Chưa có lượt check-in nào hôm nay.
          </p>
        )}
      </section>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background p-4">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
