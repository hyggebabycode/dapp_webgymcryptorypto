import Link from "next/link";
import { CalendarDays, LayoutDashboard, NotebookPen, Search, Star, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
};

type EnrollmentRow = {
  id: string;
  user_id: string;
  progress_percentage: number | null;
  status: string;
};

type LessonPlanRow = {
  course_id: string;
};

type CourseLessonRow = {
  course_id: string;
};

export default async function CoachDashboardPage() {
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const [coursesResult, lessonPlansResult] = await Promise.all([
    supabase.from("courses").select("id").eq("coach_id", session?.userId).eq("is_active", true),
    supabase
      .from("lesson_plans")
      .select("course_id")
      .eq("coach_id", session?.userId),
  ]);

  const courses = (coursesResult.data || []) as CourseRow[];
  const lessonPlans = (lessonPlansResult.data || []) as LessonPlanRow[];
  const courseIds = courses.map((course) => course.id);
  const [enrollmentsResult, courseLessonsResult] = courseIds.length
    ? await Promise.all([
        supabase
          .from("class_enrollments")
          .select("id, user_id, progress_percentage, status")
          .in("course_id", courseIds)
          .eq("status", "active")
          .eq("payment_status", "paid"),
        supabase.from("course_lessons").select("course_id").in("course_id", courseIds),
      ])
    : [{ data: [] }, { data: [] }];
  const courseLessons = (courseLessonsResult.data || []) as CourseLessonRow[];
  const enrollments = (enrollmentsResult.data || []) as EnrollmentRow[];
  const studentCount = new Set(enrollments.map((enrollment) => enrollment.user_id)).size;
  const roadmapCount = new Set([...lessonPlans.map((lessonPlan) => lessonPlan.course_id), ...courseLessons.map((lesson) => lesson.course_id)].filter(Boolean)).size;
  const averageProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, item) => sum + Number(item.progress_percentage || 0), 0) / enrollments.length)
      : 0;

  const stats = [
    { label: "Học viên của tôi", value: studentCount, icon: Users, href: "/dashboard/coach/students" },
    { label: "Khóa phải dạy", value: courses.length, icon: CalendarDays, href: "/dashboard/coach/schedule" },
    { label: "Lộ trình dạy", value: roadmapCount, icon: NotebookPen, href: "/dashboard/coach/courses" },
    { label: "Tiến độ TB", value: `${averageProgress}%`, icon: Star, href: "/dashboard/coach/students" },
  ];

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <LayoutDashboard className="text-primary" />
            <h1 className="text-3xl font-black">Bảng Điều Khiển</h1>
          </div>
          <p className="text-sm italic text-muted">Tổng quan hoạt động huấn luyện của bạn.</p>
        </div>
      </div>

      <form action="/dashboard/coach/students" className="mb-6 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" size={18} />
          <input
            className="h-11 w-full rounded-lg border border-pink-100 bg-white pl-11 pr-4 text-sm outline-none focus:border-primary"
            name="q"
            placeholder="Tìm học viên, khóa học, lịch dạy..."
          />
        </label>
      </form>

      <div className="grid gap-5 md:grid-cols-4">
        {stats.map((stat) => (
          <Link className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm hover:border-primary" href={stat.href} key={stat.label}>
            <stat.icon className="mb-4 text-primary" size={30} />
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="mt-1 text-sm text-muted">{stat.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
