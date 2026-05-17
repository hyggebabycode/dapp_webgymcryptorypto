"use server";

import { revalidatePath } from "next/cache";
import { requireActiveSession } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CartItem } from "@/components/cart/add-to-cart-button";

export type ServerCartItem = CartItem & {
  added_at: string | null;
};

function isMissingCartTable(error: unknown) {
  const maybeError = error as { message?: string; details?: string; hint?: string };
  return [maybeError.message, maybeError.details, maybeError.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes("cart_items");
}

export async function addCartItemAction(courseId: string) {
  const currentSession = await getSession();
  if (!currentSession || !courseId) return { ok: false };
  const session = await requireActiveSession("/cart");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("cart_items").upsert(
    {
      user_id: session.userId,
      course_id: courseId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" },
  );

  if (error && !isMissingCartTable(error)) {
    throw error;
  }

  revalidatePath("/cart");
  return { ok: !error };
}

export async function clearCartItemAction(courseId: string) {
  const currentSession = await getSession();
  if (!currentSession || !courseId) return { ok: false };
  const session = await requireActiveSession("/cart");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", session.userId)
    .eq("course_id", courseId);

  if (error && !isMissingCartTable(error)) {
    throw error;
  }

  revalidatePath("/cart");
  return { ok: !error };
}

export async function clearCartAction() {
  const currentSession = await getSession();
  if (!currentSession) return { ok: false };
  const session = await requireActiveSession("/cart");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", session.userId);

  if (error && !isMissingCartTable(error)) {
    throw error;
  }

  revalidatePath("/cart");
  return { ok: !error };
}

export async function syncCartItemsAction(courseIds: string[]) {
  const currentSession = await getSession();
  if (!currentSession) return { ok: false, items: [] as ServerCartItem[] };
  const session = await requireActiveSession("/cart");

  const uniqueIds = [...new Set(courseIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { ok: true, items: await getCartItems(session.userId) };
  }

  const supabase = await createSupabaseServerClient();
  const { data: validCourses, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .in("id", uniqueIds)
    .eq("is_active", true);

  if (courseError) throw courseError;

  const validIds = (validCourses || []).map((course) => String(course.id));
  if (validIds.length > 0) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("cart_items").upsert(
      validIds.map((courseId) => ({
        user_id: session.userId,
        course_id: courseId,
        updated_at: now,
      })),
      { onConflict: "user_id,course_id" },
    );

    if (error && !isMissingCartTable(error)) {
      throw error;
    }
  }

  revalidatePath("/cart");
  return { ok: true, items: await getCartItems(session.userId) };
}

export async function getCartItems(userId?: string) {
  if (!userId) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      created_at,
      courses!inner (
        id,
        course_name,
        description,
        price,
        duration_weeks,
        max_students,
        current_students,
        image_url
      )
    `,
    )
    .eq("user_id", userId)
    .eq("courses.is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingCartTable(error)) return [];
    throw error;
  }

  return (data || [])
    .map((row) => {
      const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
      if (!course) return null;

      return {
        id: String(course.id),
        course_name: String(course.course_name),
        description: course.description ?? null,
        price: Number(course.price || 0),
        duration_weeks: Number(course.duration_weeks || 0),
        max_students: Number(course.max_students || 0),
        current_students: Number(course.current_students || 0),
        image_url: course.image_url ?? null,
        added_at: row.created_at ?? null,
      } satisfies ServerCartItem;
    })
    .filter(Boolean) as ServerCartItem[];
}
