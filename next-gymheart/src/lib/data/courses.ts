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
};

export async function getCourses() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, course_name, description, price, duration_weeks, level, max_students, current_students, image_url, is_active",
    )
    .eq("is_active", true)
    .order("course_name");

  if (error) {
    console.error("Failed to load courses", error);
    return [];
  }

  return (data || []) as Course[];
}

export async function getFeaturedCourses(limit = 3) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, course_name, description, price, duration_weeks, level, max_students, current_students, image_url, is_active",
    )
    .eq("is_active", true)
    .order("course_name")
    .limit(limit);

  if (error) {
    console.error("Failed to load featured courses", error);
    return [];
  }

  return (data || []) as Course[];
}

export async function getCourseById(courseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, course_name, description, price, duration_weeks, level, max_students, current_students, image_url, is_active",
    )
    .eq("id", courseId)
    .single();

  if (error) {
    console.error("Failed to load course", error);
    return null;
  }

  return data as Course;
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
