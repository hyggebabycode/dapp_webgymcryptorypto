import { Mail } from "lucide-react";
import { StudentActions } from "@/components/coach/student-actions";
import { StudentProgressDialog } from "@/components/coach/student-progress-dialog";
import { RealtimeFilter } from "@/components/realtime-filter";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  course_name: string;
};

type EnrollmentRow = {
  id: string;
  progress_percentage: number | null;
  notes: string | null;
  users:
    | {
        full_name: string;
        email: string;
        avatar_url: string | null;
      }
    | {
        full_name: string;
        email: string;
        avatar_url: string | null;
      }[]
    | null;
  courses: { course_name: string } | { course_name: string }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function messageText(updated?: string, error?: string) {
  if (updated === "removed") return "Đã xóa học viên khỏi lớp.";
  if (updated) return "Đã cập nhật học viên thành công.";
  if (error) return "Không thể xử lý học viên. Vui lòng thử lại.";
  return null;
}

export default async function CoachStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const { data: coursesData } = await supabase
    .from("courses")
    .select("id, course_name")
    .eq("coach_id", session?.userId)
    .order("course_name");
  const courses = (coursesData || []) as CourseRow[];
  const courseIds = courses.map((course) => course.id);
  const { data: enrollmentsData } = courseIds.length
    ? await supabase
        .from("class_enrollments")
        .select("id, progress_percentage, notes, users(full_name, email, avatar_url), courses(course_name)")
        .in("course_id", courseIds)
        .eq("status", "active")
        .eq("payment_status", "paid")
    : { data: [] };

  const enrollments = ((enrollmentsData || []) as EnrollmentRow[]).sort((left, right) => {
    const leftCourse = one(left.courses)?.course_name || "";
    const rightCourse = one(right.courses)?.course_name || "";
    const courseCompare = leftCourse.localeCompare(rightCourse, "vi", { sensitivity: "base" });
    if (courseCompare !== 0) return courseCompare;

    const leftStudent = one(left.users)?.full_name || "";
    const rightStudent = one(right.users)?.full_name || "";
    return leftStudent.localeCompare(rightStudent, "vi", { sensitivity: "base" });
  });
  const message = messageText(params.updated, params.error);

  return (
    <section className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black">Học viên của tôi</h1>
          <p className="mt-2 text-sm text-muted">Xem chi tiết, cập nhật tiến độ hoặc xóa học viên khỏi lớp.</p>
        </div>
      </div>

      {message ? (
        <div className={`mb-5 rounded-lg px-4 py-3 text-sm font-bold ${params.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      ) : null}

      <RealtimeFilter
        className="mb-6"
        initialQuery={params.q || ""}
        placeholder="Tìm học viên, email hoặc khóa học..."
        scopeId="coach-students-list"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="coach-students-list">
        {enrollments.map((enrollment) => {
          const user = one(enrollment.users);
          const course = one(enrollment.courses);
          const progress = Number(enrollment.progress_percentage || 0);
          const studentName = user?.full_name || "Học viên";
          const courseName = course?.course_name || "Khóa học";

          return (
            <article
              className="rounded-xl border border-pink-100 bg-background p-4"
              data-filter-item
              data-search={`${studentName} ${user?.email || ""} ${courseName} ${enrollment.notes || ""}`}
              key={enrollment.id}
            >
              <div className="flex items-center gap-3">
                <div
                  className="size-12 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=f42559&color=fff`})`,
                  }}
                />
                <div>
                  <h3 className="font-black">{studentName}</h3>
                  <p className="text-sm text-muted">{courseName}</p>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Mail size={16} /> {user?.email || "Chưa có email"}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <span className="text-xs font-black">{progress}%</span>
              </div>
              {enrollment.notes ? <p className="mt-3 line-clamp-2 text-sm text-muted">{enrollment.notes}</p> : null}
              <StudentProgressDialog enrollmentId={enrollment.id} studentName={studentName} defaultProgress={progress} defaultNotes={enrollment.notes} />
              <StudentActions
                student={{
                  enrollmentId: enrollment.id,
                  studentName,
                  email: user?.email || "Chưa có email",
                  courseName,
                  progress,
                  notes: enrollment.notes,
                }}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
