"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireActiveSession } from "@/lib/auth/guards";
import {
  createSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

export async function updateProfileAction(formData: FormData) {
  const session = await requireActiveSession("/profile");

  const fullName = clean(formData.get("full_name"));
  const currentPassword = String(formData.get("current_password") || "");
  const newPassword = String(formData.get("new_password") || "");
  if (!fullName) {
    redirect("/profile?error=missing_name");
  }

  const supabase = await createSupabaseServerClient();
  const updatePayload: Record<string, string | null> = {
    full_name: fullName,
    phone: clean(formData.get("phone")),
    avatar_url: clean(formData.get("avatar_url")),
    date_of_birth: clean(formData.get("date_of_birth")),
    gender: clean(formData.get("gender")),
    address: clean(formData.get("address")),
    updated_at: new Date().toISOString(),
  };

  if (newPassword.trim().length > 0) {
    if (newPassword.trim().length < 6) {
      redirect("/profile?error=password_short");
    }

    const { data: account } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", session.userId)
      .single();

    const passwordMatches =
      account?.password_hash && currentPassword
        ? await bcrypt.compare(currentPassword, account.password_hash)
        : false;

    if (!passwordMatches) {
      redirect("/profile?error=current_password");
    }

    updatePayload.password_hash = await bcrypt.hash(newPassword.trim(), 10);
  }

  const { error } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", session.userId);

  if (error) {
    console.error("Failed to update profile", error);
    redirect("/profile?error=save_failed");
  }

  const cookieValue = await createSessionCookie({
    userId: session.userId,
    email: session.email,
    fullName,
    role: session.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });

  redirect("/profile?updated=1");
}
