import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";
import { requireActiveSession } from "@/lib/auth/guards";
import type { SessionPayload } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CheckInTokenPayload = {
  v: 1;
  enrollmentId: string;
  userId: string;
  courseId: string;
  issuedAt: string;
};

type CourseRow = {
  id: string;
  course_name: string;
  coach_id: string | null;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string | null;
};

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  payment_status: string | null;
  users: UserRow | UserRow[] | null;
  courses: CourseRow | CourseRow[] | null;
};

export type CheckInPreview =
  | {
      ok: true;
      token: string;
      enrollment: EnrollmentRow;
      student: UserRow | null;
      course: CourseRow | null;
      checkinDate: string;
      alreadyCheckedIn: boolean;
      schedule:
        | {
            id: string;
            title: string;
            start_time: string;
            end_time: string;
            location: string | null;
            room_number: string | null;
          }
        | null;
      warning: string | null;
    }
  | {
      ok: false;
      error: string;
    };

export type TodayCheckInRow = {
  id: string;
  checkin_time: string | null;
  method: string | null;
  note: string | null;
  studentName: string;
  studentEmail: string;
  courseName: string;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", env.cookieSecret)
    .update(value)
    .digest("base64url");
}

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value || null;
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayDayOfWeek() {
  return new Date().getDay();
}

function isMissingAttendanceTable(error: unknown) {
  const maybeError = error as {
    message?: string;
    details?: string;
    hint?: string;
  };
  return [maybeError.message, maybeError.details, maybeError.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes("attendance_checkins");
}

function checkInBasePath(role: string) {
  return role === "admin"
    ? "/dashboard/admin/check-in"
    : "/dashboard/coach/check-in";
}

function redirectWithMessage({
  error,
  role,
  token,
  updated,
}: {
  role: string;
  token?: string;
  updated?: string;
  error?: string;
}): never {
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (updated) params.set("updated", updated);
  if (error) params.set("error", error);
  redirect(`${checkInBasePath(role)}?${params.toString()}`);
}

export function createCheckInToken({
  courseId,
  enrollmentId,
  userId,
}: {
  courseId: string;
  enrollmentId: string;
  userId: string;
}) {
  const payload: CheckInTokenPayload = {
    v: 1,
    courseId,
    enrollmentId,
    userId,
    issuedAt: new Date().toISOString(),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyCheckInToken(token: string) {
  const [encodedPayload, signature] = token.trim().split(".");
  if (!encodedPayload || !signature || !safeCompare(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as CheckInTokenPayload;
    if (
      payload.v !== 1 ||
      !payload.enrollmentId ||
      !payload.userId ||
      !payload.courseId
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function requireCheckInActor() {
  const session = await requireActiveSession("/check-in");
  if (session.role !== "admin" && session.role !== "coach") {
    redirect(`/dashboard/${session.role}`);
  }

  return session;
}

async function loadCheckInContext(
  token: string,
  session: Pick<SessionPayload, "role" | "userId">,
): Promise<CheckInPreview> {
  const payload = verifyCheckInToken(token);
  if (!payload) {
    return { ok: false, error: "invalid_token" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("class_enrollments")
    .select(
      "id, user_id, course_id, status, payment_status, users(id, full_name, email), courses(id, course_name, coach_id)",
    )
    .eq("id", payload.enrollmentId)
    .maybeSingle();

  if (enrollmentError || !enrollment) {
    return { ok: false, error: "not_found" };
  }

  const typedEnrollment = enrollment as EnrollmentRow;
  const student = one(typedEnrollment.users);
  const course = one(typedEnrollment.courses);

  if (
    typedEnrollment.user_id !== payload.userId ||
    typedEnrollment.course_id !== payload.courseId ||
    student?.id !== payload.userId ||
    course?.id !== payload.courseId
  ) {
    return { ok: false, error: "token_mismatch" };
  }

  if (session.role === "coach" && course?.coach_id !== session.userId) {
    return { ok: false, error: "forbidden" };
  }

  if (
    typedEnrollment.payment_status !== "paid" ||
    !["active", "completed"].includes(typedEnrollment.status)
  ) {
    return { ok: false, error: "not_paid" };
  }

  const checkinDate = todayKey();
  const [checkinResult, scheduleResult] = await Promise.all([
    supabase
      .from("attendance_checkins")
      .select("id")
      .eq("enrollment_id", payload.enrollmentId)
      .eq("checkin_date", checkinDate)
      .maybeSingle(),
    supabase
      .from("schedules")
      .select("id, title, start_time, end_time, location, room_number")
      .eq("course_id", payload.courseId)
      .eq("day_of_week", todayDayOfWeek())
      .eq("is_cancelled", false)
      .order("start_time")
      .limit(1),
  ]);

  if (checkinResult.error && isMissingAttendanceTable(checkinResult.error)) {
    return { ok: false, error: "schema_missing" };
  }

  const schedule = scheduleResult.data?.[0] || null;

  return {
    ok: true,
    token,
    enrollment: typedEnrollment,
    student,
    course,
    checkinDate,
    alreadyCheckedIn: Boolean(checkinResult.data),
    schedule,
    warning: schedule ? null : "no_schedule_today",
  };
}

export async function getCheckInPreview(token: string) {
  const session = await requireCheckInActor();
  return loadCheckInContext(token, session);
}

export async function getTodayCheckIns() {
  const session = await requireCheckInActor();
  const supabase = await createSupabaseServerClient();
  const date = todayKey();

  let query = supabase
    .from("attendance_checkins")
    .select("id, user_id, course_id, checkin_time, method, note")
    .eq("checkin_date", date)
    .order("checkin_time", { ascending: false })
    .limit(30);

  if (session.role === "coach") {
    const { data: courses } = await supabase
      .from("courses")
      .select("id")
      .eq("coach_id", session.userId);
    const courseIds = (courses || []).map((course) => String(course.id));
    if (courseIds.length === 0) return [];
    query = query.in("course_id", courseIds);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingAttendanceTable(error)) return [];
    throw error;
  }

  const rows = data || [];
  const userIds = [...new Set(rows.map((row) => String(row.user_id)))];
  const courseIds = [...new Set(rows.map((row) => String(row.course_id)))];

  const [usersResult, coursesResult] = await Promise.all([
    userIds.length > 0
      ? supabase.from("users").select("id, full_name, email").in("id", userIds)
      : Promise.resolve({ data: [] }),
    courseIds.length > 0
      ? supabase.from("courses").select("id, course_name").in("id", courseIds)
      : Promise.resolve({ data: [] }),
  ]);

  const users = new Map(
    (usersResult.data || []).map((user) => [
      String(user.id),
      {
        name: String(user.full_name || "Học viên"),
        email: String(user.email || ""),
      },
    ]),
  );
  const courses = new Map(
    (coursesResult.data || []).map((course) => [
      String(course.id),
      String(course.course_name || "Khóa học"),
    ]),
  );

  return rows.map((row) => {
    const student = users.get(String(row.user_id));
    return {
      id: String(row.id),
      checkin_time: row.checkin_time,
      method: row.method,
      note: row.note,
      studentName: student?.name || "Học viên",
      studentEmail: student?.email || "",
      courseName: courses.get(String(row.course_id)) || "Khóa học",
    } satisfies TodayCheckInRow;
  });
}

export async function checkInEnrollmentAction(formData: FormData) {
  "use server";

  const session = await requireCheckInActor();
  const token = String(formData.get("token") || "").trim();
  if (!token) {
    redirectWithMessage({ role: session.role, error: "missing_token" });
  }

  const preview = await loadCheckInContext(token, session);
  if (!preview.ok) {
    redirectWithMessage({ role: session.role, token, error: preview.error });
  }

  if (preview.alreadyCheckedIn) {
    redirectWithMessage({ role: session.role, token, updated: "already" });
  }

  const supabase = await createSupabaseServerClient();
  const { data: createdCheckIn, error } = await supabase
    .from("attendance_checkins")
    .insert({
      enrollment_id: preview.enrollment.id,
      course_id: preview.enrollment.course_id,
      user_id: preview.enrollment.user_id,
      schedule_id: preview.schedule?.id || null,
      checkin_date: preview.checkinDate,
      checked_by: session.userId,
      method: "qr",
      note: preview.warning === "no_schedule_today" ? "Check-in ngoài lịch học hôm nay." : null,
    })
    .select("id")
    .single();

  if (error) {
    redirectWithMessage({
      role: session.role,
      token,
      error: isMissingAttendanceTable(error) ? "schema_missing" : "save_failed",
    });
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "attendance_check_in",
    entityType: "attendance_checkin",
    entityId: createdCheckIn?.id,
    details: {
      courseId: preview.enrollment.course_id,
      enrollmentId: preview.enrollment.id,
      studentId: preview.enrollment.user_id,
    },
  });

  revalidatePath("/dashboard/admin/check-in");
  revalidatePath("/dashboard/coach/check-in");
  revalidatePath("/dashboard/coach/students");
  redirectWithMessage({ role: session.role, token, updated: "checked_in" });
}
