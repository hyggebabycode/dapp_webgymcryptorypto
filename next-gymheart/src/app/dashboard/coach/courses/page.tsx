import { AddLessonPlanDialog } from "@/components/coach/add-lesson-plan-dialog";
import { CoachRoadmapPreview, type CoachRoadmapItem } from "@/components/coach/coach-roadmap-preview";
import type { LessonPlanRecord } from "@/components/coach/lesson-plan-actions";
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

type ScheduleRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
  room_number: string | null;
  max_capacity: number | null;
};

type CourseLessonRow = {
  id: string;
  course_id: string;
  lesson_order: number;
  title: string;
  content: string | null;
  objectives: string | null;
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

function messageText(updated?: string, error?: string) {
  if (updated) return "Đã cập nhật lộ trình dạy thành công.";
  if (error === "lesson_duplicate") return "Tuần này đã có trong lộ trình. Hãy sửa tuần hiện có thay vì thêm mới.";
  if (error) return "Không thể xử lý lộ trình dạy. Vui lòng kiểm tra dữ liệu.";
  return null;
}

function buildRoadmapItems(lessonPlans: LessonPlanRecord[], courseLessons: CourseLessonRow[]) {
  const coachWeeks = new Set(lessonPlans.map((lesson) => Number(lesson.week_number)));
  const uniqueCourseLessons = courseLessons.filter((lesson, index, list) => {
    const order = Number(lesson.lesson_order);
    return list.findIndex((item) => Number(item.lesson_order) === order) === index;
  });
  const coachItems: CoachRoadmapItem[] = lessonPlans.map((lesson) => {
    const details = [
      { label: "Mục tiêu", value: lesson.objectives || "" },
      { label: "Khởi động", value: lesson.warm_up || "" },
      { label: "Bài tập chính", value: lesson.main_exercises || "" },
      { label: "Thư giãn", value: lesson.cool_down || "" },
      { label: "Thiết bị", value: (lesson.equipment_needed || []).join("\n") },
      { label: "Ghi chú", value: lesson.notes || "" },
      { label: "Video hướng dẫn", value: lesson.video_url || "" },
    ].filter((detail) => detail.value);

    return {
      id: lesson.id,
      order: Number(lesson.week_number || 1),
      title: lesson.lesson_title,
      summary: lesson.objectives || lesson.main_exercises || "Chưa có nội dung chi tiết.",
      meta: `${lesson.duration_minutes || 60} phút · Độ khó ${lesson.difficulty_level || 3}/5 · ${lesson.is_published ? "Đã công khai" : "Bản nháp"}`,
      details,
      courseLesson: null,
      lessonPlan: lesson,
    };
  });
  const courseItems: CoachRoadmapItem[] = uniqueCourseLessons
    .filter((lesson) => !coachWeeks.has(Number(lesson.lesson_order)))
    .map((lesson) => ({
      id: lesson.id,
      order: Number(lesson.lesson_order || 1),
      title: lesson.title,
      summary: lesson.objectives || lesson.content || "Lộ trình học mẫu của khóa.",
      meta: "Lộ trình học mẫu",
      details: [
        { label: "Mục tiêu", value: lesson.objectives || "" },
        { label: "Nội dung", value: lesson.content || "" },
      ].filter((detail) => detail.value),
      courseLesson: lesson,
      lessonPlan: null,
    }));

  return [...coachItems, ...courseItems].sort((left, right) => left.order - right.order);
}

export default async function CoachCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const [coursesResult, lessonsResult, schedulesResult] = await Promise.all([
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
    supabase
      .from("schedules")
      .select("id, course_id, title, description, day_of_week, start_time, end_time, location, room_number, max_capacity")
      .eq("coach_id", session?.userId)
      .eq("is_cancelled", false)
      .order("day_of_week")
      .order("start_time"),
  ]);

  const courses = (coursesResult.data || []) as CourseRow[];
  const lessons = (lessonsResult.data || []) as LessonPlanRecord[];
  const schedules = (schedulesResult.data || []) as ScheduleRow[];
  const courseIds = courses.map((course) => course.id);
  const { data: courseLessonsData } = courseIds.length
    ? await supabase
        .from("course_lessons")
        .select("id, course_id, lesson_order, title, content, objectives")
        .in("course_id", courseIds)
        .order("lesson_order")
    : { data: [] };
  const courseLessons = (courseLessonsData || []) as CourseLessonRow[];
  const courseOptions = courses.map((course) => ({ id: course.id, course_name: course.course_name }));
  const message = messageText(params.updated, params.error);

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black">Khóa Học Của Tôi</h1>
          <p className="mt-2 text-sm text-muted">Quản lý khóa học được phân công, lộ trình dạy từng tuần và lịch học.</p>
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
        placeholder="Tìm khóa học, lịch học hoặc lộ trình dạy..."
        scopeId="coach-courses-list"
      />

      <div className="grid gap-4 md:grid-cols-2" id="coach-courses-list">
        {courses.map((course) => {
          const courseLessonPlans = lessons.filter((lesson) => lesson.course_id === course.id);
          const courseBaseLessons = courseLessons.filter((lesson) => lesson.course_id === course.id);
          const roadmapItems = buildRoadmapItems(courseLessonPlans, courseBaseLessons);
          const courseSchedules = schedules.filter((schedule) => schedule.course_id === course.id);
          const scheduleSearch = courseSchedules
            .map((schedule) => `${dayNames[schedule.day_of_week] || ""} ${schedule.start_time} ${schedule.end_time} ${schedule.location || ""} ${schedule.room_number || ""}`)
            .join(" ");
          return (
            <article
              className="rounded-2xl border border-pink-100 bg-background p-4"
              data-filter-item
              data-search={`${course.course_name} ${course.description || ""} ${course.schedule_description || ""} ${scheduleSearch} ${roadmapItems.map((lesson) => lesson.title).join(" ")}`}
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
                  <div className="mt-2 text-sm text-muted">
                    <span className="font-bold text-foreground">Lịch học: </span>
                    {courseSchedules.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {courseSchedules.map((schedule) => (
                          <span className="rounded-md border border-pink-100 bg-white px-2 py-1 text-xs font-bold text-muted" key={schedule.id}>
                            {dayNames[schedule.day_of_week] || "Trong tuần"} · {schedule.start_time.slice(0, 5)}-{schedule.end_time.slice(0, 5)}
                            {schedule.location ? ` · ${schedule.location}` : ""}
                            {schedule.room_number ? ` · ${schedule.room_number}` : ""}
                          </span>
                        ))}
                      </div>
                    ) : (
                      course.schedule_description || "Chưa có lịch hiển thị"
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <h4 className="font-black">Lộ trình dạy</h4>
                  <p className="mt-1 text-xs font-bold text-muted">{roadmapItems.length} tuần trong lộ trình</p>
                </div>
                <CoachRoadmapPreview courses={courseOptions} items={roadmapItems} schedules={courseSchedules} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
