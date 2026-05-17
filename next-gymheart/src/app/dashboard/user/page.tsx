import Link from "next/link";
import { BookOpen, CalendarDays, Dumbbell, Flame, GraduationCap, Trophy } from "lucide-react";
import { CourseRoadmapDialog } from "@/components/course-roadmap-dialog";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CourseInfo = {
  id: string;
  course_name: string;
  description: string | null;
  image_url: string | null;
  duration_weeks: number;
};

type EnrollmentRow = {
  id: string;
  status: string;
  payment_status: string | null;
  payment_amount: number | null;
  progress_percentage: number | null;
  courses: CourseInfo | CourseInfo[] | null;
};

function getCourse(course: EnrollmentRow["courses"]) {
  return Array.isArray(course) ? course[0] : course;
}

export default async function UserDashboardPage() {
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("class_enrollments")
    .select("id, status, payment_status, payment_amount, progress_percentage, courses!inner(id, course_name, description, image_url, duration_weeks)")
    .eq("user_id", session?.userId)
    .eq("courses.is_active", true)
    .neq("status", "cancelled")
    .order("enrollment_date", { ascending: false });

  const enrollments = (data || []) as EnrollmentRow[];
  const activeEnrollments = enrollments.filter(
    (item) => item.status === "active" && item.payment_status === "paid",
  );
  const averageProgress =
    activeEnrollments.length > 0
      ? Math.round(activeEnrollments.reduce((total, item) => total + Number(item.progress_percentage || 0), 0) / activeEnrollments.length)
      : 0;

  const stats = [
    { label: "Khóa học đã đăng ký", value: enrollments.length, icon: GraduationCap },
    { label: "Khóa đang học", value: activeEnrollments.length, icon: Dumbbell },
    { label: "Tiến độ trung bình", value: `${averageProgress}%`, icon: Flame },
    { label: "Thành tựu đạt được", value: enrollments.filter((item) => item.status === "completed").length, icon: Trophy },
  ];

  return (
    <main className="mx-auto max-w-[1440px] space-y-8 px-4 py-8 sm:px-8 lg:px-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-pink-400 p-8 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 text-white/15">
          <BookOpen size={180} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-wide text-white/80">Bảng điều khiển</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Chào mừng trở lại, {session?.fullName || "bạn"}!
          </h1>
          <p className="mt-3 text-lg leading-8 text-white/90">
            Theo dõi khóa học, tiến độ và lịch tập trong một nơi.
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        {stats.map((stat) => (
          <article className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm" key={stat.label}>
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <stat.icon size={26} />
            </div>
            <p className="text-3xl font-black">{stat.value}</p>
            <p className="mt-2 text-sm font-bold text-muted">{stat.label}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-black">
              <GraduationCap className="text-primary" />
              Khóa học đang học
            </h2>
            <p className="mt-2 text-sm text-muted">Các khóa gần nhất của bạn.</p>
          </div>
          <Link className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-black text-white" href="/my-courses">
            Xem tất cả
          </Link>
        </div>

        {activeEnrollments.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {activeEnrollments.slice(0, 4).map((enrollment) => {
              const course = getCourse(enrollment.courses);
              if (!course) return null;
              const progress = Number(enrollment.progress_percentage || 0);

              return (
                <article className="rounded-2xl border border-pink-100 bg-background p-5" key={enrollment.id}>
                  <div className="flex gap-4">
                    <div
                      className="h-28 w-36 shrink-0 rounded-xl bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${course.image_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500"})`,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-lg font-black">{course.course_name}</h3>
                      <p className="mt-2 text-sm font-bold text-muted">{course.duration_weeks} tuần</p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        <span className="text-xs font-black">{progress}%</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <CourseRoadmapDialog
                          buttonClassName="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-white"
                          courseId={course.id}
                          courseName={course.course_name}
                          label="Tiếp tục học"
                        />
                        <Link className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary px-4 text-sm font-black text-primary" href="/schedule">
                          <CalendarDays size={16} />
                          Lịch tập
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-background px-6 py-12 text-center">
            <GraduationCap className="mx-auto mb-4 text-primary" size={52} />
            <h3 className="text-xl font-black">Bạn chưa có khóa đang học</h3>
            <p className="mt-2 text-muted">Chọn một khóa học phù hợp để bắt đầu hành trình của bạn.</p>
            <Link className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-black text-white" href="/courses">
              Xem khóa học
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
