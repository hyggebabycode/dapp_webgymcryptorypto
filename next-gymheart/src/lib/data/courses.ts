import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Course = {
  id: string;
  course_name: string;
  description: string | null;
  price: number;
  duration_weeks: number;
  level: string;
  max_students: number;
  current_students: number;
  image_url: string | null;
  is_active: boolean;
  coach_id: string | null;
  start_date: string | null;
  end_date: string | null;
  schedule_description: string | null;
  benefits: string[] | null;
  requirements: string[] | null;
  coach: {
    full_name: string;
    specialization: string | null;
    avatar_url: string | null;
    years_of_experience: number | null;
  } | null;
};

const courseSelect = `
  id,
  course_name,
  description,
  price,
  duration_weeks,
  level,
  max_students,
  current_students,
  image_url,
  is_active,
  coach_id,
  start_date,
  end_date,
  schedule_description,
  benefits,
  requirements,
  users!courses_coach_id_fkey (
    full_name,
    specialization,
    avatar_url,
    years_of_experience
  )
`;

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeCourse(row: Record<string, unknown>) {
  const coach = one(
    row.users as
      | {
          full_name?: string | null;
          specialization?: string | null;
          avatar_url?: string | null;
          years_of_experience?: number | null;
        }
      | Array<{
          full_name?: string | null;
          specialization?: string | null;
          avatar_url?: string | null;
          years_of_experience?: number | null;
        }>
      | null
      | undefined,
  );

  return {
    id: String(row.id),
    course_name: String(row.course_name),
    description: (row.description as string | null) ?? null,
    price: Number(row.price || 0),
    duration_weeks: Number(row.duration_weeks || 0),
    level: String(row.level || "all_levels"),
    max_students: Number(row.max_students || 0),
    current_students: Number(row.current_students || 0),
    image_url: (row.image_url as string | null) ?? null,
    is_active: Boolean(row.is_active),
    coach_id: (row.coach_id as string | null) ?? null,
    start_date: (row.start_date as string | null) ?? null,
    end_date: (row.end_date as string | null) ?? null,
    schedule_description: (row.schedule_description as string | null) ?? null,
    benefits: (row.benefits as string[] | null) ?? null,
    requirements: (row.requirements as string[] | null) ?? null,
    coach: coach?.full_name
      ? {
          full_name: coach.full_name,
          specialization: coach.specialization ?? null,
          avatar_url: coach.avatar_url ?? null,
          years_of_experience: coach.years_of_experience ?? null,
        }
      : null,
  } satisfies Course;
}

export async function getCourses() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select(courseSelect)
    .eq("is_active", true)
    .order("course_name");

  if (error) {
    console.error("Failed to load courses", error);
    return [];
  }

  return ((data || []) as Record<string, unknown>[]).map(normalizeCourse);
}

export async function getFeaturedCourses(limit = 3) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select(courseSelect)
    .eq("is_active", true)
    .order("course_name")
    .limit(limit);

  if (error) {
    console.error("Failed to load featured courses", error);
    return [];
  }

  return ((data || []) as Record<string, unknown>[]).map(normalizeCourse);
}

export async function getCourseById(courseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select(courseSelect)
    .eq("id", courseId)
    .single();

  if (error) {
    console.error("Failed to load course", error);
    return null;
  }

  return normalizeCourse(data as Record<string, unknown>);
}

export async function getEnrolledCourseIds(userId?: string) {
  if (!userId) return new Set<string>();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_enrollments")
    .select("course_id")
    .eq("user_id", userId)
    .in("status", ["active", "completed"])
    .eq("payment_status", "paid");

  if (error) {
    console.error("Failed to load enrolled course ids", error);
    return new Set<string>();
  }

  return new Set((data || []).map((row) => row.course_id as string));
}
