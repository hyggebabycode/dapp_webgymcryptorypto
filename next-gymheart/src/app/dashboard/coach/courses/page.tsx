import { AddLessonPlanDialog } from "@/components/coach/add-lesson-plan-dialog";
import { LessonPlanActions, type LessonPlanRecord } from "@/components/coach/lesson-plan-actions";
import { RealtimeFilter } from "@/components/realtime-filter";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  course_name: string;
  description: string | null;
  image_url: string | null;
  current_students: number;
  max_students: number;
  duration_weeks: number;
  schedule_description: string | null;
};

function messageText(updated?: string, error?: string) {
  if (updated) return "Đã cập nhật giáo án thành công.";
  if (error) return "Không thể xử lý giáo án. Vui lòng kiểm tra dữ liệu.";
  return null;
}

export default async function CoachCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const [coursesResult, lessonsResult] = await Promise.all([
    supabase
      .from("courses")
      .select("id, course_name, description, image_url, current_students, max_students, duration_weeks, schedule_description")
      .eq("coach_id", session?.userId)
      .eq("is_active", true)
      .order("course_name"),
    supabase
      .from("lesson_plans")
      .select("id, course_id, week_number, lesson_title, objectives, warm_up, main_exercises, cool_down, equipment_needed, duration_minutes, difficulty_level, notes, video_url, is_published")
      .eq("coach_id", session?.userId)
      .order("week_number"),
  ]);

  const courses = (coursesResult.data || []) as CourseRow[];
  const lessons = (lessonsResult.data || []) as LessonPlanRecord[];
  const courseOptions = courses.map((course) => ({ id: course.id, course_name: course.course_name }));
  const message = messageText(params.updated, params.error);

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black">Khóa Học Của Tôi</h1>
          <p className="mt-2 text-sm text-muted">Quản lý khóa học được phân công và giáo án từng tuần.</p>
        </div>
        <AddLessonPlanDialog courses={courseOptions} />
      </div>

      {message ? (
        <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-bold ${params.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      ) : null}

      <RealtimeFilter
        className="mb-6"
        initialQuery={params.q || ""}
        placeholder="Tìm khóa học, lịch học hoặc giáo án..."
        scopeId="coach-courses-list"
      />

      <div className="grid gap-4 md:grid-cols-2" id="coach-courses-list">
        {courses.map((course) => {
          const courseLessons = lessons.filter((lesson) => lesson.course_id === course.id);
          return (
            <article
              className="rounded-2xl border border-pink-100 bg-background p-4"
              data-filter-item
              data-search={`${course.course_name} ${course.description || ""} ${course.schedule_description || ""} ${courseLessons.map((lesson) => lesson.lesson_title).join(" ")}`}
              key={course.id}
            >
              <div className="flex gap-4">
                <div
                  className="h-28 w-36 shrink-0 rounded-xl bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${course.image_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500"})`,
                  }}
                />
                <div>
                  <h3 className="font-black">{course.course_name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{course.description}</p>
                  <p className="mt-3 text-sm font-bold text-primary">
                    Học viên: {course.current_students}/{course.max_students} · {course.duration_weeks} tuần
                  </p>
                  <p className="mt-1 text-sm text-muted">{course.schedule_description || "Chưa có lịch hiển thị"}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <h4 className="font-black">Giáo án ({courseLessons.length})</h4>
                {courseLessons.length > 0 ? (
                  courseLessons.map((lesson) => (
                    <div className="rounded-xl bg-white p-4" key={lesson.id}>
                      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                        <div>
                          <p className="font-black">Tuần {lesson.week_number}: {lesson.lesson_title}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted">{lesson.objectives || lesson.main_exercises || "Chưa có nội dung chi tiết."}</p>
                          <p className="mt-2 text-xs font-bold text-muted">
                            {lesson.duration_minutes || 60} phút · Độ khó {lesson.difficulty_level || 3}/5 · {lesson.is_published ? "Đã công khai" : "Bản nháp"}
                          </p>
                        </div>
                        <LessonPlanActions courses={courseOptions} lesson={lesson} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-muted">Chưa có giáo án cho khóa học này.</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
