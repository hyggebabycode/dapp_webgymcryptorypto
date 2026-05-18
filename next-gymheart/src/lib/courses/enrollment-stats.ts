import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type EnrollmentStatus = "active" | "completed";

const countedStatuses: EnrollmentStatus[] = ["active", "completed"];

export async function refreshCourseEnrollmentStats(
  supabase: SupabaseServerClient,
  courseId?: string | null,
) {
  if (!courseId) return;

  const { count, error } = await supabase
    .from("class_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
    .eq("payment_status", "paid")
    .in("status", countedStatuses);

  if (error) {
    console.error("Failed to refresh course enrollment stats", error);
    return;
  }

  await supabase
    .from("courses")
    .update({ current_students: count ?? 0 })
    .eq("id", courseId);
}
