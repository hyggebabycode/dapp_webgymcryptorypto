import Link from "next/link";
import { ArrowLeft, CalendarDays, Mail, Phone, Star, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CoachRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  specialization: string | null;
  years_of_experience: number | null;
  certification: string | null;
  is_active: boolean;
};

type CourseRow = {
  id: string;
  course_name: string;
  current_students: number;
  max_students: number;
};

type ScheduleRow = {
  id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
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

export default async function AdminCoachDetailPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = await params;
  const supabase = await createSupabaseServerClient();
  const [coachResult, coursesResult, schedulesResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, phone, avatar_url, bio, specialization, years_of_experience, certification, is_active")
      .eq("id", coachId)
      .eq("role", "coach")
      .single(),
    supabase
      .from("courses")
      .select("id, course_name, current_students, max_students")
      .eq("coach_id", coachId)
      .order("course_name"),
    supabase
      .from("schedules")
      .select("id, title, day_of_week, start_time, end_time")
      .eq("coach_id", coachId)
      .order("day_of_week")
      .order("start_time"),
  ]);

  const coach = coachResult.data as CoachRow | null;
  const courses = (coursesResult.data || []) as CourseRow[];
  const schedules = (schedulesResult.data || []) as ScheduleRow[];

  if (!coach) {
    return (
      <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black">Không tìm thấy huấn luyện viên</h1>
        <Link className="mt-4 inline-flex font-black text-primary" href="/dashboard/admin/coaches">
          Quay lại danh sách
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-black text-primary" href="/dashboard/admin/coaches">
        <ArrowLeft size={16} />
        Quay lại danh sách HLV
      </Link>

      <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div
            className="size-24 rounded-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${coach.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.full_name)}&background=f42559&color=fff`})`,
            }}
          />
          <div className="flex-1">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <h1 className="text-3xl font-black">{coach.full_name}</h1>
                <p className="mt-2 text-muted">{coach.specialization || "Chưa cập nhật chuyên môn"}</p>
              </div>
              <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                {coach.is_active ? "Đang hoạt động" : "Đã khóa"}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <p className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                {coach.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-primary" />
                {coach.phone || "Chưa cập nhật số điện thoại"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <article className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <Star className="mb-4 text-primary" />
          <p className="text-2xl font-black">{coach.years_of_experience ?? 0} năm</p>
          <p className="mt-1 text-sm text-muted">Kinh nghiệm</p>
        </article>
        <article className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <Users className="mb-4 text-primary" />
          <p className="text-2xl font-black">
            {courses.reduce((sum, course) => sum + Number(course.current_students || 0), 0)}
          </p>
          <p className="mt-1 text-sm text-muted">Học viên đang phụ trách</p>
        </article>
        <article className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <CalendarDays className="mb-4 text-primary" />
          <p className="text-2xl font-black">{schedules.length}</p>
          <p className="mt-1 text-sm text-muted">Lịch dạy</p>
        </article>
      </div>

      <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Thông tin chuyên môn</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-background p-4">
            <p className="text-sm font-black text-muted">Chứng chỉ</p>
            <p className="mt-2">{coach.certification || "Chưa cập nhật"}</p>
          </div>
          <div className="rounded-xl bg-background p-4">
            <p className="text-sm font-black text-muted">Giới thiệu</p>
            <p className="mt-2">{coach.bio || "Chưa cập nhật mô tả."}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Khóa học và lịch dạy</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            {courses.map((course) => (
              <div className="rounded-xl bg-background p-4" key={course.id}>
                <p className="font-black">{course.course_name}</p>
                <p className="mt-1 text-sm text-muted">
                  {course.current_students}/{course.max_students} học viên
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div className="rounded-xl bg-background p-4" key={schedule.id}>
                <p className="font-black">{schedule.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {dayNames[schedule.day_of_week]} · {schedule.start_time} - {schedule.end_time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
