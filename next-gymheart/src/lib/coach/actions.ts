"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/guards";
import { refreshCourseEnrollmentStats } from "@/lib/courses/enrollment-stats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireCoach() {
  return requireRole("coach", "/dashboard/coach");
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

function cleanNumber(value: FormDataEntryValue | null, fallback = 0) {
  const number = Number(value || fallback);
  return Number.isFinite(number) ? number : fallback;
}

function minNumber(
  value: FormDataEntryValue | null,
  fallback: number,
  min: number,
) {
  return Math.max(min, cleanNumber(value, fallback));
}

function clampNumber(
  value: FormDataEntryValue | null,
  fallback: number,
  min: number,
  max: number,
) {
  return Math.max(min, Math.min(max, cleanNumber(value, fallback)));
}

function cleanLines(value: FormDataEntryValue | null) {
  const lines = String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : null;
}

function timeToMinutes(value: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function isValidDay(day: number) {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

async function hasCoachScheduleConflict({
  coachId,
  dayOfWeek,
  startTime,
  endTime,
  excludeScheduleId,
}: {
  coachId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  excludeScheduleId?: string;
}) {
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);
  if (newStart == null || newEnd == null || newStart >= newEnd) return true;

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("schedules")
    .select("id, start_time, end_time")
    .eq("coach_id", coachId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_cancelled", false);

  if (excludeScheduleId) {
    query = query.neq("id", excludeScheduleId);
  }

  const { data, error } = await query;
  if (error) return true;

  return (data || []).some((schedule) => {
    const existingStart = timeToMinutes(String(schedule.start_time));
    const existingEnd = timeToMinutes(String(schedule.end_time));
    if (existingStart == null || existingEnd == null) return false;
    return newStart < existingEnd && newEnd > existingStart;
  });
}

export async function addCoachScheduleAction(formData: FormData) {
  const session = await requireCoach();
  const courseId = clean(formData.get("course_id"));
  const title = clean(formData.get("title"));
  const dayOfWeek = cleanNumber(formData.get("day_of_week"));
  const startTime = clean(formData.get("start_time"));
  const endTime = clean(formData.get("end_time"));

  if (!courseId || !title || !startTime || !endTime || !isValidDay(dayOfWeek)) {
    redirect("/dashboard/coach/schedule?error=missing");
  }

  if (
    timeToMinutes(startTime) == null ||
    timeToMinutes(endTime) == null ||
    timeToMinutes(startTime)! >= timeToMinutes(endTime)!
  ) {
    redirect("/dashboard/coach/schedule?error=time_invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, is_active")
    .eq("id", courseId)
    .eq("coach_id", session.userId)
    .maybeSingle();

  if (!course?.is_active) {
    redirect("/dashboard/coach/schedule?error=course");
  }

  if (
    await hasCoachScheduleConflict({
      coachId: session.userId,
      dayOfWeek,
      startTime,
      endTime,
    })
  ) {
    redirect("/dashboard/coach/schedule?error=schedule_conflict");
  }

  const { data: createdSchedule, error } = await supabase
    .from("schedules")
    .insert({
      course_id: courseId,
      coach_id: session.userId,
      title,
      description: clean(formData.get("description")),
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      location: clean(formData.get("location")),
      room_number: clean(formData.get("room_number")),
      max_capacity: minNumber(formData.get("max_capacity"), 20, 1),
      is_recurring: true,
    })
    .select("id")
    .single();

  if (error) {
    redirect("/dashboard/coach/schedule?error=create_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "coach_create_schedule",
    entityType: "schedule",
    entityId: createdSchedule?.id,
    details: { courseId, title, dayOfWeek, startTime, endTime },
  });

  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/schedule");
  redirect("/dashboard/coach/schedule?updated=created");
}

export async function updateCoachScheduleAction(formData: FormData) {
  const session = await requireCoach();
  const scheduleId = clean(formData.get("schedule_id"));
  const courseId = clean(formData.get("course_id"));
  const title = clean(formData.get("title"));
  const startTime = clean(formData.get("start_time"));
  const endTime = clean(formData.get("end_time"));
  const dayOfWeek = cleanNumber(formData.get("day_of_week"));

  if (
    !scheduleId ||
    !courseId ||
    !title ||
    !startTime ||
    !endTime ||
    !isValidDay(dayOfWeek)
  ) {
    redirect("/dashboard/coach/schedule?error=missing");
  }

  if (
    timeToMinutes(startTime) == null ||
    timeToMinutes(endTime) == null ||
    timeToMinutes(startTime)! >= timeToMinutes(endTime)!
  ) {
    redirect("/dashboard/coach/schedule?error=time_invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, is_active")
    .eq("id", courseId)
    .eq("coach_id", session.userId)
    .maybeSingle();

  if (!course?.is_active) {
    redirect("/dashboard/coach/schedule?error=course");
  }

  if (
    await hasCoachScheduleConflict({
      coachId: session.userId,
      dayOfWeek,
      startTime,
      endTime,
      excludeScheduleId: scheduleId,
    })
  ) {
    redirect("/dashboard/coach/schedule?error=schedule_conflict");
  }

  const { data: updatedSchedule, error } = await supabase
    .from("schedules")
    .update({
      course_id: courseId,
      title,
      description: clean(formData.get("description")),
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      location: clean(formData.get("location")),
      room_number: clean(formData.get("room_number")),
      max_capacity: minNumber(formData.get("max_capacity"), 20, 1),
      updated_at: new Date().toISOString(),
    })
    .eq("id", scheduleId)
    .eq("coach_id", session.userId)
    .select("id")
    .maybeSingle();

  if (error || !updatedSchedule) {
    redirect("/dashboard/coach/schedule?error=update_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "coach_update_schedule",
    entityType: "schedule",
    entityId: scheduleId,
    details: { courseId, title, dayOfWeek, startTime, endTime },
  });

  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/schedule");
  redirect("/dashboard/coach/schedule?updated=saved");
}

export async function deleteCoachScheduleAction(formData: FormData) {
  const session = await requireCoach();
  const scheduleId = clean(formData.get("schedule_id"));

  if (!scheduleId) {
    redirect("/dashboard/coach/schedule?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: deletedSchedule, error } = await supabase
    .from("schedules")
    .update({
      is_cancelled: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scheduleId)
    .eq("coach_id", session.userId)
    .select("id")
    .maybeSingle();

  if (error || !deletedSchedule) {
    redirect("/dashboard/coach/schedule?error=delete_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "coach_cancel_schedule",
    entityType: "schedule",
    entityId: scheduleId,
  });

  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/schedule");
  redirect("/dashboard/coach/schedule?updated=deleted");
}

export async function addLessonPlanAction(formData: FormData) {
  const session = await requireCoach();
  const courseId = clean(formData.get("course_id"));
  const lessonTitle = clean(formData.get("lesson_title"));
  const weekNumber = cleanNumber(formData.get("week_number"), 1);

  if (!courseId || !lessonTitle || weekNumber <= 0) {
    redirect("/dashboard/coach/courses?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("coach_id", session.userId)
    .maybeSingle();

  if (!course) {
    redirect("/dashboard/coach/courses?error=course");
  }

  const { data: existingLesson } = await supabase
    .from("lesson_plans")
    .select("id")
    .eq("course_id", courseId)
    .eq("coach_id", session.userId)
    .eq("week_number", weekNumber)
    .maybeSingle();

  if (existingLesson) {
    redirect("/dashboard/coach/courses?error=lesson_duplicate");
  }

  const { data: createdLesson, error } = await supabase
    .from("lesson_plans")
    .insert({
      course_id: courseId,
      coach_id: session.userId,
      week_number: weekNumber,
      lesson_title: lessonTitle,
      objectives: clean(formData.get("objectives")),
      warm_up: clean(formData.get("warm_up")),
      main_exercises: clean(formData.get("main_exercises")),
      cool_down: clean(formData.get("cool_down")),
      equipment_needed: cleanLines(formData.get("equipment_needed")),
      duration_minutes: minNumber(formData.get("duration_minutes"), 60, 1),
      difficulty_level: clampNumber(formData.get("difficulty_level"), 3, 1, 5),
      notes: clean(formData.get("notes")),
      video_url: clean(formData.get("video_url")),
      is_published: formData.get("is_published") === "on",
    })
    .select("id")
    .single();

  if (error) {
    redirect("/dashboard/coach/courses?error=create_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "coach_create_lesson_plan",
    entityType: "lesson_plan",
    entityId: createdLesson?.id,
    details: { courseId, lessonTitle, weekNumber },
  });

  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/courses");
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/my-courses");
  redirect("/dashboard/coach/courses?updated=lesson_created");
}

export async function updateLessonPlanAction(formData: FormData) {
  const session = await requireCoach();
  const lessonId = clean(formData.get("lesson_id"));
  const courseId = clean(formData.get("course_id"));
  const lessonTitle = clean(formData.get("lesson_title"));
  const weekNumber = cleanNumber(formData.get("week_number"), 1);

  if (!lessonId || !courseId || !lessonTitle || weekNumber <= 0) {
    redirect("/dashboard/coach/courses?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("coach_id", session.userId)
    .maybeSingle();

  if (!course) {
    redirect("/dashboard/coach/courses?error=course");
  }

  const { data: conflictingLesson } = await supabase
    .from("lesson_plans")
    .select("id")
    .eq("course_id", courseId)
    .eq("coach_id", session.userId)
    .eq("week_number", weekNumber)
    .neq("id", lessonId)
    .maybeSingle();

  if (conflictingLesson) {
    redirect("/dashboard/coach/courses?error=lesson_duplicate");
  }

  const { data: updatedLesson, error } = await supabase
    .from("lesson_plans")
    .update({
      course_id: courseId,
      week_number: weekNumber,
      lesson_title: lessonTitle,
      objectives: clean(formData.get("objectives")),
      warm_up: clean(formData.get("warm_up")),
      main_exercises: clean(formData.get("main_exercises")),
      cool_down: clean(formData.get("cool_down")),
      equipment_needed: cleanLines(formData.get("equipment_needed")),
      duration_minutes: minNumber(formData.get("duration_minutes"), 60, 1),
      difficulty_level: clampNumber(formData.get("difficulty_level"), 3, 1, 5),
      notes: clean(formData.get("notes")),
      video_url: clean(formData.get("video_url")),
      is_published: formData.get("is_published") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", lessonId)
    .eq("coach_id", session.userId)
    .select("id")
    .maybeSingle();

  if (error || !updatedLesson) {
    redirect("/dashboard/coach/courses?error=lesson_update_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "coach_update_lesson_plan",
    entityType: "lesson_plan",
    entityId: lessonId,
    details: { courseId, lessonTitle, weekNumber },
  });

  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/courses");
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/my-courses");
  redirect("/dashboard/coach/courses?updated=lesson_saved");
}

export async function deleteLessonPlanAction(formData: FormData) {
  const session = await requireCoach();
  const lessonId = clean(formData.get("lesson_id"));

  if (!lessonId) {
    redirect("/dashboard/coach/courses?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: deletedLesson, error } = await supabase
    .from("lesson_plans")
    .delete()
    .eq("id", lessonId)
    .eq("coach_id", session.userId)
    .select("id, course_id")
    .maybeSingle();

  if (error || !deletedLesson) {
    redirect("/dashboard/coach/courses?error=lesson_delete_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "coach_delete_lesson_plan",
    entityType: "lesson_plan",
    entityId: lessonId,
  });

  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/courses");
  revalidatePath("/courses");
  revalidatePath(`/courses/${deletedLesson.course_id}`);
  revalidatePath("/my-courses");
  redirect("/dashboard/coach/courses?updated=lesson_deleted");
}

export async function updateCourseLessonAction(formData: FormData) {
  const session = await requireCoach();
  const lessonId = clean(formData.get("course_lesson_id"));
  const courseId = clean(formData.get("course_id"));
  const lessonOrder = cleanNumber(formData.get("lesson_order"), 1);
  const title = clean(formData.get("title"));
  const content = clean(formData.get("content"));

  if (!lessonId || !courseId || lessonOrder <= 0 || !title || !content) {
    redirect("/dashboard/coach/courses?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("coach_id", session.userId)
    .maybeSingle();

  if (!course) {
    redirect("/dashboard/coach/courses?error=course");
  }

  const { data: updatedLesson, error } = await supabase
    .from("course_lessons")
    .update({
      lesson_order: lessonOrder,
      title,
      content,
      objectives: clean(formData.get("objectives")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .select("id")
    .maybeSingle();

  if (error || !updatedLesson) {
    redirect("/dashboard/coach/courses?error=lesson_update_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "coach_update_course_lesson",
    entityType: "course_lesson",
    entityId: lessonId,
    details: { courseId, title, lessonOrder },
  });

  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/courses");
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/my-courses");
  redirect("/dashboard/coach/courses?updated=lesson_saved");
}

export async function deleteCourseLessonAction(formData: FormData) {
  const session = await requireCoach();
  const lessonId = clean(formData.get("course_lesson_id"));
  const courseId = clean(formData.get("course_id"));

  if (!lessonId || !courseId) {
    redirect("/dashboard/coach/courses?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("coach_id", session.userId)
    .maybeSingle();

  if (!course) {
    redirect("/dashboard/coach/courses?error=course");
  }

  const { data: deletedLesson, error } = await supabase
    .from("course_lessons")
    .delete()
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .select("id")
    .maybeSingle();

  if (error || !deletedLesson) {
    redirect("/dashboard/coach/courses?error=lesson_delete_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "coach_delete_course_lesson",
    entityType: "course_lesson",
    entityId: lessonId,
    details: { courseId },
  });

  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/courses");
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/my-courses");
  redirect("/dashboard/coach/courses?updated=lesson_deleted");
}

export async function updateStudentProgressAction(formData: FormData) {
  const session = await requireCoach();
  const enrollmentId = clean(formData.get("enrollment_id"));
  const progress = Math.max(
    0,
    Math.min(100, cleanNumber(formData.get("progress_percentage"))),
  );

  if (!enrollmentId) {
    redirect("/dashboard/coach/students?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("id, course_id, courses!inner(coach_id)")
    .eq("id", enrollmentId)
    .eq("courses.coach_id", session.userId)
    .maybeSingle();

  if (!enrollment) {
    redirect("/dashboard/coach/students?error=not_allowed");
  }

  const { data: updatedEnrollment, error } = await supabase
    .from("class_enrollments")
    .update({
      progress_percentage: progress,
      notes: clean(formData.get("notes")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId)
    .select("id")
    .maybeSingle();

  if (error || !updatedEnrollment) {
    redirect("/dashboard/coach/students?error=update_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "coach_update_student_progress",
    entityType: "enrollment",
    entityId: enrollmentId,
    details: { progress },
  });

  revalidatePath("/dashboard/coach/students");
  redirect("/dashboard/coach/students?updated=progress");
}

export async function removeStudentEnrollmentAction(formData: FormData) {
  const session = await requireCoach();
  const enrollmentId = clean(formData.get("enrollment_id"));

  if (!enrollmentId) {
    redirect("/dashboard/coach/students?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("id, course_id, courses!inner(coach_id)")
    .eq("id", enrollmentId)
    .eq("courses.coach_id", session.userId)
    .maybeSingle();

  if (!enrollment) {
    redirect("/dashboard/coach/students?error=not_allowed");
  }

  const { data: removedEnrollment, error } = await supabase
    .from("class_enrollments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId)
    .select("id")
    .maybeSingle();

  if (error || !removedEnrollment) {
    redirect("/dashboard/coach/students?error=remove_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "coach_remove_student_enrollment",
    entityType: "enrollment",
    entityId: enrollmentId,
  });

  await refreshCourseEnrollmentStats(supabase, enrollment.course_id);

  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/students");
  revalidatePath("/dashboard/coach/courses");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/courses");
  revalidatePath(`/courses/${enrollment.course_id}`);
  redirect("/dashboard/coach/students?updated=removed");
}
