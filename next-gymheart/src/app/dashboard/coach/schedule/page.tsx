import { AddScheduleDialog } from "@/components/coach/add-schedule-dialog";
import type { CoachScheduleRecord } from "@/components/coach/schedule-actions";
import { CoachWeeklySchedule, type CoachWeeklyScheduleRecord } from "@/components/coach/coach-weekly-schedule";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ScheduleRow = CoachScheduleRecord & {
  courses: { course_name: string } | { course_name: string }[] | null;
};

type CourseOption = {
  id: string;
  course_name: string;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function messageText(updated?: string, error?: string) {
  if (updated) return "Đã cập nhật lịch dạy thành công.";
  if (error === "time_invalid") return "Giờ kết thúc phải lớn hơn giờ bắt đầu.";
  if (error === "schedule_conflict") return "Bạn đã có lịch dạy trùng khung giờ này.";
  if (error === "course") return "Chỉ được tạo lịch cho khóa học đang mở và thuộc quyền của bạn.";
  if (error === "missing") return "Vui lòng nhập đủ khóa học, tên buổi, ngày học và khung giờ.";
  if (error) return "Không thể xử lý lịch dạy. Vui lòng kiểm tra dữ liệu.";
  return null;
}

export default async function CoachSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const [schedulesResult, coursesResult] = await Promise.all([
    supabase
      .from("schedules")
      .select("id, course_id, title, description, day_of_week, start_time, end_time, location, room_number, max_capacity, courses(course_name)")
      .eq("coach_id", session?.userId)
      .eq("is_cancelled", false)
      .order("day_of_week")
      .order("start_time"),
    supabase.from("courses").select("id, course_name").eq("coach_id", session?.userId).eq("is_active", true).order("course_name"),
  ]);

  const schedules = ((schedulesResult.data || []) as ScheduleRow[]).sort((left, right) => {
    const leftCourse = one(left.courses)?.course_name || "";
    const rightCourse = one(right.courses)?.course_name || "";
    const courseCompare = leftCourse.localeCompare(rightCourse, "vi", { sensitivity: "base" });
    if (courseCompare !== 0) return courseCompare;

    const dayCompare = Number(left.day_of_week) - Number(right.day_of_week);
    if (dayCompare !== 0) return dayCompare;

    return String(left.start_time || "").localeCompare(String(right.start_time || ""));
  });
  const courses = (coursesResult.data || []) as CourseOption[];
  const scheduleRecords: CoachWeeklyScheduleRecord[] = schedules.map((schedule) => ({
    id: schedule.id,
    course_id: schedule.course_id,
    courseName: one(schedule.courses)?.course_name || "Khóa học",
    title: schedule.title,
    description: schedule.description,
    day_of_week: schedule.day_of_week,
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    location: schedule.location,
    room_number: schedule.room_number,
    max_capacity: schedule.max_capacity,
  }));
  const message = messageText(params.updated, params.error);

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black">Lịch Dạy</h1>
          <p className="mt-2 text-sm text-muted">Thêm, sửa và xóa lịch dạy riêng của huấn luyện viên.</p>
        </div>
        <AddScheduleDialog courses={courses} />
      </div>

      {message ? (
        <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-bold ${params.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      ) : null}

      <CoachWeeklySchedule courses={courses} initialDate={new Date().toISOString()} schedules={scheduleRecords} />
    </section>
  );
}
