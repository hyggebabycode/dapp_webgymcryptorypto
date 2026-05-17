"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedRoles = new Set(["admin", "coach", "user"]);
const allowedCourseLevels = new Set(["beginner", "intermediate", "advanced", "all_levels"]);

async function requireAdmin() {
  return requireRole("admin", "/dashboard/admin");
}

function adminMessagePath(section: "users" | "coaches" | "enrollments", status: "updated" | "error", code: string) {
  const hash = section === "enrollments" && code.includes("pt") ? "#pt-requests" : "";
  return `/dashboard/admin/${section}?${status}=${code}${hash}`;
}

function isSchemaColumnError(error: unknown, columns: string | string[]) {
  const maybeError = error as { message?: string; details?: string; hint?: string };
  const text = [maybeError.message, maybeError.details, maybeError.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const columnList = Array.isArray(columns) ? columns : [columns];
  return columnList.some((column) => text.includes(column.toLowerCase()));
}

export async function approvePtRequestAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") || "");
  if (!userId) {
    redirect("/dashboard/admin/enrollments?error=approve_pt_failed#pt-requests");
  }

  const supabase = await createSupabaseServerClient();
  let result = await supabase
    .from("users")
    .update({
      role: "coach",
      requested_role: null,
      pt_request_status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("requested_role", "coach")
    .select("id")
    .maybeSingle();

  if (result.error && isSchemaColumnError(result.error, ["pt_request_status", "pt_request_note"])) {
    result = await supabase
      .from("users")
      .update({
        role: "coach",
        requested_role: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .eq("requested_role", "coach")
      .select("id")
      .maybeSingle();
  }

  if (result.error || !result.data) {
    redirect("/dashboard/admin/enrollments?error=approve_pt_failed#pt-requests");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "approve_pt_request",
    entityType: "user",
    entityId: userId,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/enrollments");
  revalidatePath("/dashboard/admin/coaches");
  redirect("/dashboard/admin/enrollments?updated=approved#pt-requests");
}

export async function rejectPtRequestAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") || "");
  if (!userId) {
    redirect("/dashboard/admin/enrollments?error=reject_pt_failed#pt-requests");
  }

  const supabase = await createSupabaseServerClient();
  let result = await supabase
    .from("users")
    .update({
      requested_role: null,
      pt_request_status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("requested_role", "coach")
    .select("id")
    .maybeSingle();

  if (result.error && isSchemaColumnError(result.error, "pt_request_status")) {
    result = await supabase
      .from("users")
      .update({
        requested_role: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .eq("requested_role", "coach")
      .select("id")
      .maybeSingle();
  }

  if (result.error || !result.data) {
    redirect("/dashboard/admin/enrollments?error=reject_pt_failed#pt-requests");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "reject_pt_request",
    entityType: "user",
    entityId: userId,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/enrollments");
  redirect("/dashboard/admin/enrollments?updated=rejected#pt-requests");
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

function cleanNumber(value: FormDataEntryValue | null, fallback = 0) {
  const number = Number(value || fallback);
  return Number.isFinite(number) ? number : fallback;
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

function isInvalidDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return false;
  return new Date(startDate).getTime() > new Date(endDate).getTime();
}

function cleanRole(value: FormDataEntryValue | null) {
  const role = String(value || "user");
  return allowedRoles.has(role) ? role : null;
}

function cleanCourseLevel(value: FormDataEntryValue | null) {
  const level = String(value || "all_levels");
  return allowedCourseLevels.has(level) ? level : null;
}

function parseCourseLessons(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [rawTitle, rawContent, rawObjectives] = line.split("|").map((item) => item?.trim());
      const title = rawTitle || `Buổi ${index + 1}`;

      return {
        lesson_order: index + 1,
        title,
        content: rawContent || `Nội dung chi tiết cho ${title}.`,
        objectives: rawObjectives || null,
      };
    });
}

async function replaceCourseLessons(courseId: string, lessons: ReturnType<typeof parseCourseLessons>) {
  if (lessons.length === 0) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("course_lessons").delete().eq("course_id", courseId);
  const { error } = await supabase.from("course_lessons").insert(
    lessons.map((lesson) => ({
      course_id: courseId,
      lesson_order: lesson.lesson_order,
      title: lesson.title,
      content: lesson.content,
      objectives: lesson.objectives,
    })),
  );

  if (error) throw error;
}

async function ensureAssignableCoach(coachId: string | null, errorPath: string) {
  if (!coachId) return null;

  const supabase = await createSupabaseServerClient();
  const { data: coach, error } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", coachId)
    .maybeSingle();

  if (error || coach?.role !== "coach" || !coach?.is_active) {
    redirect(errorPath);
  }

  return coachId;
}

async function hasScheduleConflict({
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

export async function addCourseAction(formData: FormData) {
  const session = await requireAdmin();
  const courseName = clean(formData.get("course_name"));
  const price = cleanNumber(formData.get("price"));
  const durationWeeks = cleanNumber(formData.get("duration_weeks"));
  const maxStudents = cleanNumber(formData.get("max_students"), 20);
  const level = cleanCourseLevel(formData.get("level"));
  const startDate = clean(formData.get("start_date"));
  const endDate = clean(formData.get("end_date"));

  if (!courseName || !level || price <= 0 || durationWeeks <= 0 || maxStudents <= 0) {
    redirect("/dashboard/admin/courses?error=missing");
  }

  if (isInvalidDateRange(startDate, endDate)) {
    redirect("/dashboard/admin/courses?error=date_invalid");
  }

  const supabase = await createSupabaseServerClient();
  const coachId = await ensureAssignableCoach(clean(formData.get("coach_id")), "/dashboard/admin/courses?error=coach_invalid");
  const lessons = parseCourseLessons(formData.get("lessons"));
  const { data: createdCourse, error } = await supabase.from("courses").insert({
    course_name: courseName,
    description: clean(formData.get("description")),
    price,
    duration_weeks: durationWeeks,
    level,
    max_students: maxStudents > 0 ? maxStudents : 20,
    image_url: clean(formData.get("image_url")),
    coach_id: coachId,
    start_date: startDate,
    end_date: endDate,
    schedule_description: clean(formData.get("schedule_description")),
    benefits: cleanLines(formData.get("benefits")),
    requirements: cleanLines(formData.get("requirements")),
    is_active: true,
    created_by: session.userId,
  }).select("id").single();

  if (error) {
    redirect("/dashboard/admin/courses?error=create_failed");
  }

  try {
    await replaceCourseLessons(createdCourse.id, lessons);
  } catch {
    redirect("/dashboard/admin/courses?error=lesson_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "create_course",
    entityType: "course",
    entityId: createdCourse?.id,
    details: { courseName, price, durationWeeks, maxStudents, level },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/courses");
  redirect("/dashboard/admin/courses?updated=created");
}

export async function updateCourseAction(formData: FormData) {
  const session = await requireAdmin();
  const courseId = String(formData.get("course_id") || "");
  const courseName = clean(formData.get("course_name"));
  const price = cleanNumber(formData.get("price"));
  const durationWeeks = cleanNumber(formData.get("duration_weeks"));
  const maxStudents = cleanNumber(formData.get("max_students"), 20);
  const level = cleanCourseLevel(formData.get("level"));
  const startDate = clean(formData.get("start_date"));
  const endDate = clean(formData.get("end_date"));

  if (!courseId || !courseName || !level || price <= 0 || durationWeeks <= 0 || maxStudents <= 0) {
    redirect("/dashboard/admin/courses?error=missing");
  }

  if (isInvalidDateRange(startDate, endDate)) {
    redirect("/dashboard/admin/courses?error=date_invalid");
  }

  const supabase = await createSupabaseServerClient();
  const coachId = await ensureAssignableCoach(clean(formData.get("coach_id")), "/dashboard/admin/courses?error=coach_invalid");
  const { data: currentCourse } = await supabase
    .from("courses")
    .select("current_students")
    .eq("id", courseId)
    .maybeSingle();

  if (Number(currentCourse?.current_students || 0) > maxStudents) {
    redirect("/dashboard/admin/courses?error=capacity_invalid");
  }

  const { error } = await supabase
    .from("courses")
    .update({
      course_name: courseName,
      description: clean(formData.get("description")),
      price,
      duration_weeks: durationWeeks,
      level,
      max_students: maxStudents > 0 ? maxStudents : 20,
      image_url: clean(formData.get("image_url")),
      coach_id: coachId,
      start_date: startDate,
      end_date: endDate,
      schedule_description: clean(formData.get("schedule_description")),
      benefits: cleanLines(formData.get("benefits")),
      requirements: cleanLines(formData.get("requirements")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (error) {
    redirect("/dashboard/admin/courses?error=update_failed");
  }

  const lessonText = String(formData.get("lessons") || "").trim();
  if (lessonText) {
    try {
      await replaceCourseLessons(courseId, parseCourseLessons(lessonText));
    } catch {
      redirect("/dashboard/admin/courses?error=lesson_failed");
    }
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "update_course",
    entityType: "course",
    entityId: courseId,
    details: { courseName, price, durationWeeks, maxStudents, level },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/courses");
  redirect("/dashboard/admin/courses?updated=saved");
}

export async function toggleCourseStatusAction(formData: FormData) {
  const session = await requireAdmin();
  const courseId = String(formData.get("course_id") || "");
  const nextActive = String(formData.get("next_active")) === "true";

  if (!courseId) {
    redirect("/dashboard/admin/courses?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("courses")
    .update({
      is_active: nextActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (error) {
    redirect("/dashboard/admin/courses?error=status_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: nextActive ? "show_course" : "hide_course",
    entityType: "course",
    entityId: courseId,
    details: { isActive: nextActive },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/courses");
  redirect(`/dashboard/admin/courses?updated=${nextActive ? "shown" : "hidden"}`);
}

export async function deleteCourseAction(formData: FormData) {
  const session = await requireAdmin();
  const courseId = String(formData.get("course_id") || "");

  if (!courseId) {
    redirect("/dashboard/admin/courses?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("courses")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (error) {
    redirect("/dashboard/admin/courses?error=delete_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "archive_course",
    entityType: "course",
    entityId: courseId,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/courses");
  redirect("/dashboard/admin/courses?updated=archived");
}

export async function addAdminScheduleAction(formData: FormData) {
  const session = await requireAdmin();
  const courseId = clean(formData.get("course_id"));
  const coachId = clean(formData.get("coach_id"));
  const title = clean(formData.get("title"));
  const dayOfWeek = cleanNumber(formData.get("day_of_week"));
  const startTime = clean(formData.get("start_time"));
  const endTime = clean(formData.get("end_time"));

  if (!courseId || !coachId || !title || !startTime || !endTime || !isValidDay(dayOfWeek)) {
    redirect("/dashboard/admin/schedules?error=missing");
  }

  if (timeToMinutes(startTime) == null || timeToMinutes(endTime) == null || timeToMinutes(startTime)! >= timeToMinutes(endTime)!) {
    redirect("/dashboard/admin/schedules?error=time_invalid");
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: course }, { data: coach }] = await Promise.all([
    supabase.from("courses").select("id, is_active").eq("id", courseId).maybeSingle(),
    supabase.from("users").select("id, role, is_active").eq("id", coachId).maybeSingle(),
  ]);

  if (!course?.is_active || coach?.role !== "coach" || !coach?.is_active) {
    redirect("/dashboard/admin/schedules?error=invalid_assignment");
  }

  if (await hasScheduleConflict({ coachId, dayOfWeek, startTime, endTime })) {
    redirect("/dashboard/admin/schedules?error=schedule_conflict");
  }

  const { data: createdSchedule, error } = await supabase.from("schedules").insert({
    course_id: courseId,
    coach_id: coachId,
    title,
    description: clean(formData.get("description")),
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    location: clean(formData.get("location")),
    room_number: clean(formData.get("room_number")),
    max_capacity: cleanNumber(formData.get("max_capacity"), 20),
    is_recurring: true,
  }).select("id").single();

  if (error) {
    redirect("/dashboard/admin/schedules?error=create_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "create_schedule",
    entityType: "schedule",
    entityId: createdSchedule?.id,
    details: { courseId, coachId, title, dayOfWeek, startTime, endTime },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/schedules");
  redirect("/dashboard/admin/schedules?updated=created");
}

export async function updateScheduleAction(formData: FormData) {
  const session = await requireAdmin();
  const scheduleId = String(formData.get("schedule_id") || "");
  const courseId = clean(formData.get("course_id"));
  const coachId = clean(formData.get("coach_id"));
  const title = clean(formData.get("title"));
  const startTime = clean(formData.get("start_time"));
  const endTime = clean(formData.get("end_time"));

  const dayOfWeek = cleanNumber(formData.get("day_of_week"));

  if (!scheduleId || !courseId || !coachId || !title || !startTime || !endTime || !isValidDay(dayOfWeek)) {
    redirect("/dashboard/admin/schedules?error=missing");
  }

  if (timeToMinutes(startTime) == null || timeToMinutes(endTime) == null || timeToMinutes(startTime)! >= timeToMinutes(endTime)!) {
    redirect("/dashboard/admin/schedules?error=time_invalid");
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: course }, { data: coach }] = await Promise.all([
    supabase.from("courses").select("id, is_active").eq("id", courseId).maybeSingle(),
    supabase.from("users").select("id, role, is_active").eq("id", coachId).maybeSingle(),
  ]);

  if (!course?.is_active || coach?.role !== "coach" || !coach?.is_active) {
    redirect("/dashboard/admin/schedules?error=invalid_assignment");
  }

  if (await hasScheduleConflict({ coachId, dayOfWeek, startTime, endTime, excludeScheduleId: scheduleId })) {
    redirect("/dashboard/admin/schedules?error=schedule_conflict");
  }

  const { error } = await supabase
    .from("schedules")
    .update({
      course_id: courseId,
      coach_id: coachId,
      title,
      description: clean(formData.get("description")),
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      location: clean(formData.get("location")),
      room_number: clean(formData.get("room_number")),
      max_capacity: cleanNumber(formData.get("max_capacity"), 20),
      updated_at: new Date().toISOString(),
    })
    .eq("id", scheduleId);

  if (error) {
    redirect("/dashboard/admin/schedules?error=update_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "update_schedule",
    entityType: "schedule",
    entityId: scheduleId,
    details: { courseId, coachId, title, dayOfWeek, startTime, endTime },
  });

  revalidatePath("/dashboard/admin/schedules");
  redirect("/dashboard/admin/schedules?updated=saved");
}

export async function deleteScheduleAction(formData: FormData) {
  const session = await requireAdmin();
  const scheduleId = String(formData.get("schedule_id") || "");

  if (!scheduleId) {
    redirect("/dashboard/admin/schedules?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("schedules")
    .update({
      is_cancelled: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scheduleId);

  if (error) {
    redirect("/dashboard/admin/schedules?error=delete_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "cancel_schedule",
    entityType: "schedule",
    entityId: scheduleId,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/schedules");
  redirect("/dashboard/admin/schedules?updated=deleted");
}

export async function addCoachAction(formData: FormData) {
  const session = await requireAdmin();
  const fullName = clean(formData.get("full_name"));
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "123456");

  if (!fullName || !email || password.length < 6) {
    redirect("/dashboard/admin/coaches?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const passwordHash = await bcrypt.hash(password, 10);
  const { data: createdCoach, error } = await supabase.from("users").insert({
    full_name: fullName,
    email,
    phone: clean(formData.get("phone")),
    avatar_url: clean(formData.get("avatar_url")),
    gender: clean(formData.get("gender")),
    date_of_birth: clean(formData.get("date_of_birth")),
    address: clean(formData.get("address")),
    bio: clean(formData.get("bio")),
    specialization: clean(formData.get("specialization")),
    years_of_experience: cleanNumber(formData.get("years_of_experience")),
    certification: clean(formData.get("certification")),
    role: "coach",
    password_hash: passwordHash,
    is_active: true,
  }).select("id").single();

  if (error) {
    redirect("/dashboard/admin/coaches?error=create_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "create_coach",
    entityType: "user",
    entityId: createdCoach?.id,
    details: { fullName, email },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/coaches");
  redirect("/dashboard/admin/coaches?updated=created");
}

export async function addPtRequestAction(formData: FormData) {
  const session = await requireAdmin();
  const fullName = clean(formData.get("full_name"));
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "123456");

  if (!fullName || !email || password.length < 6) {
    redirect("/dashboard/admin/enrollments?error=missing#pt-requests");
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (existingUser?.role === "admin" || existingUser?.role === "coach") {
    redirect("/dashboard/admin/enrollments?error=create_pt_failed#pt-requests");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const payload = {
    full_name: fullName,
    email,
    phone: clean(formData.get("phone")),
    avatar_url: clean(formData.get("avatar_url")),
    gender: clean(formData.get("gender")),
    date_of_birth: clean(formData.get("date_of_birth")),
    address: clean(formData.get("address")),
    specialization: clean(formData.get("specialization")),
    years_of_experience: cleanNumber(formData.get("years_of_experience")),
    certification: clean(formData.get("certification")),
    bio: clean(formData.get("bio")),
    pt_request_note: [
      clean(formData.get("availability")) ? `Thời gian có thể dạy: ${clean(formData.get("availability"))}` : "",
      clean(formData.get("portfolio_url")) ? `Hồ sơ/portfolio: ${clean(formData.get("portfolio_url"))}` : "",
      clean(formData.get("note")) ? `Ghi chú: ${clean(formData.get("note"))}` : "",
    ].filter(Boolean).join("\n") || null,
    requested_role: "coach",
    pt_request_status: "pending",
    role: "user",
    password_hash: passwordHash,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  let result = await supabase.from("users").upsert(payload, { onConflict: "email" });

  if (result.error && isSchemaColumnError(result.error, "pt_request_status")) {
    result = await supabase.from("users").upsert(
      {
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        avatar_url: payload.avatar_url,
        gender: payload.gender,
        date_of_birth: payload.date_of_birth,
        address: payload.address,
        specialization: payload.specialization,
        years_of_experience: payload.years_of_experience,
        certification: payload.certification,
        bio: payload.bio,
        requested_role: payload.requested_role,
        role: payload.role,
        password_hash: payload.password_hash,
        is_active: payload.is_active,
        updated_at: payload.updated_at,
      },
      { onConflict: "email" },
    );
  }

  if (result.error) {
    redirect("/dashboard/admin/enrollments?error=create_pt_failed#pt-requests");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "create_pt_request",
    entityType: "user",
    details: { fullName, email },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/enrollments");
  redirect("/dashboard/admin/enrollments?updated=pt_created#pt-requests");
}

export async function addUserAction(formData: FormData) {
  const session = await requireAdmin();
  const fullName = clean(formData.get("full_name"));
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = clean(formData.get("phone"));
  const role = cleanRole(formData.get("role"));
  const password = String(formData.get("password") || "123456");

  if (!fullName || !email || !role || password.length < 6) {
    redirect("/dashboard/admin/users?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const passwordHash = await bcrypt.hash(password, 10);
  const { data: createdUser, error } = await supabase.from("users").insert({
    full_name: fullName,
    email,
    phone,
    role,
    password_hash: passwordHash,
    is_active: true,
  }).select("id").single();

  if (error) {
    redirect("/dashboard/admin/users?error=create_failed");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "create_user",
    entityType: "user",
    entityId: createdUser?.id,
    details: { fullName, email, role },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");
  redirect("/dashboard/admin/users?updated=created");
}

export async function updateUserAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") || "");
  const fullName = clean(formData.get("full_name"));
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = cleanRole(formData.get("role"));
  const redirectTo = String(formData.get("redirect_to") || "users") as "users" | "coaches";

  if (!userId || !fullName || !email || !role) {
    redirect(adminMessagePath(redirectTo, "error", "missing"));
  }

  const supabase = await createSupabaseServerClient();
  const updatePayload: Record<string, string | number | boolean | null> = {
    full_name: fullName,
    email,
    phone: clean(formData.get("phone")),
    avatar_url: clean(formData.get("avatar_url")),
    bio: clean(formData.get("bio")),
    specialization: clean(formData.get("specialization")),
    years_of_experience: cleanNumber(formData.get("years_of_experience")),
    certification: clean(formData.get("certification")),
    updated_at: new Date().toISOString(),
  };

  if (session.userId !== userId) {
    updatePayload.role = role;
  }

  const password = String(formData.get("password") || "");
  if (password.trim().length > 0) {
    if (password.trim().length < 6) {
      redirect(adminMessagePath(redirectTo, "error", "password"));
    }
    updatePayload.password_hash = await bcrypt.hash(password.trim(), 10);
  }

  const { error } = await supabase.from("users").update(updatePayload).eq("id", userId);

  if (error) {
    redirect(adminMessagePath(redirectTo, "error", "update_failed"));
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "update_user",
    entityType: "user",
    entityId: userId,
    details: { fullName, email, role: updatePayload.role || role },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/coaches");
  redirect(adminMessagePath(redirectTo, "updated", "saved"));
}

export async function toggleUserStatusAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") || "");
  const nextActive = String(formData.get("next_active")) === "true";
  const redirectTo = String(formData.get("redirect_to") || "users") as "users" | "coaches";

  if (!userId || userId === session.userId) {
    redirect(adminMessagePath(redirectTo, "error", "self_status"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("users")
    .update({
      is_active: nextActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    redirect(adminMessagePath(redirectTo, "error", "status_failed"));
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: nextActive ? "activate_user" : "deactivate_user",
    entityType: "user",
    entityId: userId,
    details: { isActive: nextActive },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/coaches");
  redirect(adminMessagePath(redirectTo, "updated", nextActive ? "activated" : "deactivated"));
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") || "");
  const redirectTo = String(formData.get("redirect_to") || "users") as "users" | "coaches";

  if (!userId || userId === session.userId) {
    redirect(adminMessagePath(redirectTo, "error", "self_delete"));
  }

  const supabase = await createSupabaseServerClient();
  const { data: target } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();
  if (target?.role === "admin") {
    redirect(adminMessagePath(redirectTo, "error", "admin_delete"));
  }

  const { error } = await supabase
    .from("users")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    redirect(adminMessagePath(redirectTo, "error", "delete_failed"));
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "archive_user",
    entityType: "user",
    entityId: userId,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/coaches");
  redirect(adminMessagePath(redirectTo, "updated", "archived"));
}

export async function updateEnrollmentStatusAction(formData: FormData) {
  const session = await requireAdmin();
  const enrollmentId = String(formData.get("enrollment_id") || "");
  const status = String(formData.get("status") || "active");

  if (!enrollmentId || !["pending", "active", "completed", "cancelled"].includes(status)) {
    redirect("/dashboard/admin/enrollments?error=enrollment_missing#course-enrollments");
  }

  const supabase = await createSupabaseServerClient();
  const { data: current, error: currentError } = await supabase
    .from("class_enrollments")
    .select("payment_status, payment_date")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (currentError || !current) {
    redirect("/dashboard/admin/enrollments?error=enrollment_missing#course-enrollments");
  }

  const now = new Date().toISOString();
  const shouldMarkPaid = status === "active" || status === "completed";
  const paymentStatus = shouldMarkPaid
    ? "paid"
    : current.payment_status === "paid"
      ? "paid"
      : "pending";

  const { error } = await supabase
    .from("class_enrollments")
    .update({
      status,
      payment_status: paymentStatus,
      payment_date: shouldMarkPaid ? current.payment_date || now : current.payment_date,
      updated_at: now,
    })
    .eq("id", enrollmentId);

  if (error) {
    redirect("/dashboard/admin/enrollments?error=enrollment_update_failed#course-enrollments");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "update_enrollment_status",
    entityType: "enrollment",
    entityId: enrollmentId,
    details: { status, paymentStatus },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/enrollments");
  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/students");
  revalidatePath("/my-courses");
  revalidatePath("/schedule");
  redirect("/dashboard/admin/enrollments?updated=enrollment_saved#course-enrollments");
}

export async function deleteEnrollmentAction(formData: FormData) {
  const session = await requireAdmin();
  const enrollmentId = String(formData.get("enrollment_id") || "");

  if (!enrollmentId) {
    redirect("/dashboard/admin/enrollments?error=enrollment_missing#course-enrollments");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("class_enrollments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);

  if (error) {
    redirect("/dashboard/admin/enrollments?error=enrollment_delete_failed#course-enrollments");
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "archive_enrollment",
    entityType: "enrollment",
    entityId: enrollmentId,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/enrollments");
  revalidatePath("/dashboard/coach");
  revalidatePath("/dashboard/coach/students");
  revalidatePath("/my-courses");
  revalidatePath("/schedule");
  redirect("/dashboard/admin/enrollments?updated=enrollment_deleted#course-enrollments");
}
