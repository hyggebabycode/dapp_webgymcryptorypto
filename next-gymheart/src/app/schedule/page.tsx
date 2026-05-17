import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const dayNames: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ hai",
  2: "Thứ ba",
  3: "Thứ tư",
  4: "Thứ năm",
  5: "Thứ sáu",
  6: "Thứ bảy",
};

type ScheduleRow = {
  id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
  room_number: string | null;
  courses: { course_name: string } | { course_name: string }[] | null;
};

export default async function SchedulePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/schedule");
  }

  const supabase = await createSupabaseServerClient();
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("course_id, courses!inner(id)")
    .eq("user_id", session.userId)
    .eq("status", "active")
    .eq("payment_status", "paid")
    .eq("courses.is_active", true);

  const courseIds = (enrollments || []).map((item) => item.course_id as string);
  const { data: schedules } = courseIds.length
    ? await supabase
        .from("schedules")
        .select("id, title, day_of_week, start_time, end_time, location, room_number, courses(course_name)")
        .in("course_id", courseIds)
        .eq("is_cancelled", false)
        .order("day_of_week")
        .order("start_time")
    : { data: [] };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <div className="mb-8 flex items-center gap-3">
        <CalendarDays className="text-primary" />
        <div>
          <h1 className="text-4xl font-black">Lịch tập</h1>
          <p className="mt-2 text-muted">Các buổi học trong những khóa bạn đang tham gia.</p>
        </div>
      </div>

      {(schedules as ScheduleRow[]).length > 0 ? (
        <div className="grid gap-4">
          {(schedules as ScheduleRow[]).map((schedule) => {
            const course = Array.isArray(schedule.courses)
              ? schedule.courses[0]
              : schedule.courses;

            return (
              <article
                key={schedule.id}
                className="rounded-xl border border-border-soft bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm font-black text-primary">
                      {dayNames[schedule.day_of_week] || "Trong tuần"}
                    </p>
                    <h2 className="mt-1 text-xl font-black">{schedule.title}</h2>
                    <p className="mt-2 text-sm text-muted">{course?.course_name}</p>
                  </div>
                  <div className="grid gap-2 text-sm font-bold text-muted sm:grid-cols-2">
                    <span className="inline-flex items-center gap-2">
                      <Clock size={16} />
                      {schedule.start_time} - {schedule.end_time}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={16} />
                      {schedule.location || "Phòng tập"}
                      {schedule.room_number ? `, ${schedule.room_number}` : ""}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border-soft bg-white p-8 text-center shadow-sm">
          <p className="text-muted">Bạn chưa có lịch tập. Hãy đăng ký một khóa học để bắt đầu.</p>
          <Link
            href="/courses"
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-black text-white"
          >
            Xem khóa học
          </Link>
        </div>
      )}
    </section>
  );
}
