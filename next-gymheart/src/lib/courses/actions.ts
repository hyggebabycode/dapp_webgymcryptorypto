"use server";

import { revalidatePath } from "next/cache";
import { requireActiveSession } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { refreshCourseEnrollmentStats } from "@/lib/courses/enrollment-stats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CourseLesson = {
  id: string;
  lesson_order: number;
  title: string;
  content: string;
  objectives: string | null;
};

export type CourseSchedule = {
  id: string;
  title: string;
  description: string | null;
  day_of_week: number;
  occurrence_date: string | null;
  occurrence_label: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  room_number: string | null;
};

export type CartCourse = {
  id: string;
  course_name: string;
  description: string | null;
  price: number;
  duration_weeks: number;
  max_students: number;
  current_students: number;
  image_url: string | null;
};

export async function getCourseRoadmapAction(courseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_lessons")
    .select("id, lesson_order, title, content, objectives")
    .eq("course_id", courseId)
    .order("lesson_order");

  if (error) {
    console.error("Failed to load course roadmap", error);
  } else if (data && data.length > 0) {
    return data as CourseLesson[];
  }

  const { data: lessonPlans, error: lessonPlanError } = await supabase
    .from("lesson_plans")
    .select(
      "id, week_number, lesson_title, objectives, warm_up, main_exercises, cool_down, notes",
    )
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("week_number");

  if (lessonPlanError) {
    console.error("Failed to load published lesson plans", lessonPlanError);
    return [];
  }

  return (lessonPlans || []).map((lesson) => {
    const blocks = [
      lesson.warm_up ? `Khởi động: ${lesson.warm_up}` : "",
      lesson.main_exercises ? `Bài tập chính: ${lesson.main_exercises}` : "",
      lesson.cool_down ? `Thư giãn: ${lesson.cool_down}` : "",
      lesson.notes ? `Ghi chú: ${lesson.notes}` : "",
    ].filter(Boolean);

    return {
      id: String(lesson.id),
      lesson_order: Number(lesson.week_number || 1),
      title: String(lesson.lesson_title || `Buổi ${lesson.week_number}`),
      content:
        blocks.join("\n") ||
        "Huấn luyện viên sẽ cập nhật nội dung chi tiết trước buổi học.",
      objectives: lesson.objectives ?? null,
    } satisfies CourseLesson;
  });
}

export async function getCourseScheduleAction(courseId: string) {
  const supabase = await createSupabaseServerClient();
  const [courseResult, scheduleResult] = await Promise.all([
    supabase
      .from("courses")
      .select("start_date, end_date")
      .eq("id", courseId)
      .maybeSingle(),
    supabase
      .from("schedules")
      .select(
        "id, title, description, day_of_week, start_time, end_time, location, room_number",
      )
      .eq("course_id", courseId)
      .eq("is_cancelled", false)
      .order("day_of_week")
      .order("start_time"),
  ]);

  if (scheduleResult.error) {
    console.error("Failed to load course schedule", scheduleResult.error);
    return [];
  }

  const schedules = (scheduleResult.data || []) as Omit<
    CourseSchedule,
    "occurrence_date" | "occurrence_label"
  >[];
  const startDate = parseDateOnly(courseResult.data?.start_date ?? null);
  const endDate = parseDateOnly(courseResult.data?.end_date ?? null);

  if (!startDate || !endDate || startDate.getTime() > endDate.getTime()) {
    return schedules.map((schedule) => ({
      ...schedule,
      occurrence_date: null,
      occurrence_label: null,
    }));
  }

  const occurrences: CourseSchedule[] = [];
  for (
    const date = new Date(startDate);
    date.getTime() <= endDate.getTime();
    date.setDate(date.getDate() + 1)
  ) {
    const daySchedules = schedules.filter(
      (schedule) => Number(schedule.day_of_week) === date.getDay(),
    );
    for (const schedule of daySchedules) {
      const occurrenceDate = formatDateOnly(date);
      occurrences.push({
        ...schedule,
        id: `${schedule.id}-${occurrenceDate}`,
        occurrence_date: occurrenceDate,
        occurrence_label: formatScheduleDate(date),
      });
    }
  }

  return occurrences.sort((left, right) => {
    const dateCompare = String(left.occurrence_date).localeCompare(
      String(right.occurrence_date),
    );
    if (dateCompare !== 0) return dateCompare;
    return left.start_time.localeCompare(right.start_time);
  });
}

function parseDateOnly(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  )
    return null;
  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatScheduleDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export async function getCartCoursesAction(courseIds: string[]) {
  const uniqueIds = [...new Set(courseIds)].filter(Boolean);
  if (uniqueIds.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, course_name, description, price, duration_weeks, max_students, current_students, image_url",
    )
    .eq("is_active", true)
    .in("id", uniqueIds);

  if (error) {
    console.error("Failed to load cart courses", error);
    return [];
  }

  return (data || []) as CartCourse[];
}

export async function cancelEnrollmentAction(formData: FormData) {
  const currentSession = await getSession();
  if (!currentSession) return;
  const session = await requireActiveSession("/my-courses");

  const enrollmentId = String(formData.get("enrollment_id") || "");
  if (!enrollmentId) return;

  const supabase = await createSupabaseServerClient();
  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("course_id")
    .eq("id", enrollmentId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!enrollment) return;

  const { error } = await supabase
    .from("class_enrollments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId)
    .eq("user_id", session.userId);

  if (error) {
    console.error("Failed to cancel enrollment", error);
  }

  await refreshCourseEnrollmentStats(supabase, enrollment.course_id);

  revalidatePath("/my-courses");
  revalidatePath("/dashboard/user");
  revalidatePath("/courses");
  revalidatePath(`/courses/${enrollment.course_id}`);
}
