import {
  AddAdminScheduleButton,
  ScheduleRowActions,
  type ScheduleAdminRecord,
} from "@/components/admin/admin-schedule-actions";
import { RealtimeFilter } from "@/components/realtime-filter";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ScheduleRow = ScheduleAdminRecord & {
  courses: { course_name: string } | { course_name: string }[] | null;
  users: { full_name: string } | { full_name: string }[] | null;
};

type Option = {
  id: string;
  name: string;
};

const dayNames: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ hai",
  2: "Thứ ba",
  3: "Thứ tư",
  4: "Thứ năm",
  5: "Thứ sáu",
  6: "Thứ bảy",
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function messageText(updated?: string, error?: string) {
  if (updated) return "Đã cập nhật lịch học thành công.";
  if (error === "time_invalid") return "Giờ kết thúc phải lớn hơn giờ bắt đầu.";
  if (error === "invalid_assignment") return "Khóa học phải đang mở và HLV phải còn hoạt động.";
  if (error === "schedule_conflict") return "HLV đã có lịch trùng khung giờ này.";
  if (error === "missing") return "Vui lòng nhập đủ khóa học, HLV, ngày học và khung giờ.";
  if (error) return "Không thể xử lý lịch học. Vui lòng kiểm tra dữ liệu.";
  return null;
}

export default async function AdminSchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [schedulesResult, coursesResult, coachesResult] = await Promise.all([
    supabase
      .from("schedules")
      .select("id, course_id, coach_id, title, description, day_of_week, start_time, end_time, location, room_number, max_capacity, courses(course_name), users(full_name)")
      .eq("is_cancelled", false)
      .order("day_of_week")
      .order("start_time"),
    supabase.from("courses").select("id, course_name").eq("is_active", true).order("course_name"),
    supabase.from("users").select("id, full_name").eq("role", "coach").eq("is_active", true).order("full_name"),
  ]);

  const courses: Option[] = (coursesResult.data || []).map((course) => ({
    id: course.id,
    name: course.course_name,
  }));
  const coaches: Option[] = (coachesResult.data || []).map((coach) => ({
    id: coach.id,
    name: coach.full_name,
  }));
  const schedules = (schedulesResult.data || []) as ScheduleRow[];
  const message = messageText(params.updated, params.error);

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black">Lịch Học</h1>
          <p className="mt-2 text-sm text-muted">Thêm, sửa, xóa lịch học và lịch dạy trên toàn hệ thống.</p>
        </div>
        <AddAdminScheduleButton coaches={coaches} courses={courses} />
      </div>

      {message ? (
        <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-bold ${params.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      ) : null}

      <RealtimeFilter
        className="mb-6"
        initialQuery={params.q || ""}
        placeholder="Tìm lịch học theo tên lớp, khóa học, HLV hoặc địa điểm..."
        scopeId="admin-schedules-table"
      />

      <div className="overflow-x-auto rounded-2xl border border-pink-100" id="admin-schedules-table">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-primary-soft text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Buổi học</th>
              <th className="px-4 py-3">Khóa học</th>
              <th className="px-4 py-3">HLV</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Địa điểm</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-100">
            {schedules.map((schedule) => {
              const course = one(schedule.courses);
              const coach = one(schedule.users);
              return (
                <tr
                  className="hover:bg-primary-soft/60"
                  data-filter-item
                  data-search={`${schedule.title} ${schedule.description || ""} ${course?.course_name || ""} ${coach?.full_name || ""} ${schedule.location || ""} ${schedule.room_number || ""}`}
                  key={schedule.id}
                >
                  <td className="px-4 py-4">
                    <p className="font-black">{schedule.title}</p>
                    <p className="text-xs text-muted">{schedule.description || "Không có mô tả"}</p>
                  </td>
                  <td className="px-4 py-4 text-muted">{course?.course_name || "Chưa gán"}</td>
                  <td className="px-4 py-4 text-muted">{coach?.full_name || "Chưa gán"}</td>
                  <td className="px-4 py-4 font-bold text-primary">
                    {dayNames[schedule.day_of_week]} · {schedule.start_time} - {schedule.end_time}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {schedule.location || "Phòng tập"} {schedule.room_number ? `· ${schedule.room_number}` : ""}
                  </td>
                  <td className="px-4 py-4">
                    <ScheduleRowActions
                      coaches={coaches}
                      courses={courses}
                      schedule={{
                        id: schedule.id,
                        course_id: schedule.course_id,
                        coach_id: schedule.coach_id,
                        title: schedule.title,
                        description: schedule.description,
                        day_of_week: schedule.day_of_week,
                        start_time: schedule.start_time,
                        end_time: schedule.end_time,
                        location: schedule.location,
                        room_number: schedule.room_number,
                        max_capacity: schedule.max_capacity,
                      }}
                    />
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
