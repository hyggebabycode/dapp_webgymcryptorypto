"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { requireActiveSession } from "@/lib/auth/guards";
import {
  createSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { imageFieldToUrl, ImageUploadError } from "@/lib/image-upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

function isSchemaColumnError(error: unknown, columns: string | string[]) {
  const maybeError = error as {
    message?: string;
    details?: string;
    hint?: string;
  };
  const text = [maybeError.message, maybeError.details, maybeError.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const columnList = Array.isArray(columns) ? columns : [columns];
  return columnList.some((column) => text.includes(column.toLowerCase()));
}

export async function updateProfileAction(formData: FormData) {
  const session = await requireActiveSession("/profile");

  const fullName = clean(formData.get("full_name"));
  if (!fullName) {
    redirect("/profile?error=missing_name");
  }

  const supabase = await createSupabaseServerClient();
  let avatarUrl: string | null;
  try {
    avatarUrl = await imageFieldToUrl(formData, "avatar_file", "avatar_url");
  } catch (error) {
    if (error instanceof ImageUploadError) {
      redirect("/profile?error=image_invalid");
    }
    throw error;
  }

  const updatePayload: Record<string, string | null> = {
    full_name: fullName,
    phone: clean(formData.get("phone")),
    avatar_url: avatarUrl,
    date_of_birth: clean(formData.get("date_of_birth")),
    gender: clean(formData.get("gender")),
    address: clean(formData.get("address")),
    updated_at: new Date().toISOString(),
  };

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

function cleanNumber(value: FormDataEntryValue | null, fallback = 0) {
  const number = Number(value || fallback);
  return Number.isFinite(number) ? number : fallback;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileFromFormData(value: FormDataEntryValue | null) {
  if (!value || typeof value === "string") return null;

  const maybeFile = value as File;
  if (!maybeFile.name || maybeFile.size <= 0) return null;

  return maybeFile;
}

function safeStorageName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function isAllowedPtFile(file: File) {
  const allowedTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
  ]);
  const allowedExtension = /\.(pdf|doc|docx|png|jpe?g)$/i.test(file.name);
  return allowedTypes.has(file.type) || allowedExtension;
}

async function uploadPtApplicationFile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  file: File,
  email: string,
) {
  const bucket = "pt-application-files";
  const folder = safeStorageName(email) || "pt";
  const storedName = `${crypto.randomUUID()}-${safeStorageName(file.name) || "cv"}`;
  const filePath = `${folder}/${storedName}`;

  let uploadResult = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadResult.error) {
    await supabase.storage.createBucket(bucket, { public: false });
    uploadResult = await supabase.storage.from(bucket).upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  }

  if (!uploadResult.error) {
    return { storagePath: `${bucket}/${uploadResult.data.path}`, publicPath: null };
  }

  try {
    const publicPath = `/uploads/pt-applications/${filePath}`;
    const diskPath = path.join(process.cwd(), "public", "uploads", "pt-applications", folder, storedName);
    await mkdir(path.dirname(diskPath), { recursive: true });
    await writeFile(diskPath, Buffer.from(await file.arrayBuffer()));

    return { storagePath: null, publicPath };
  } catch {
    return null;
  }
}

export async function verifyCurrentPasswordAction(currentPassword: string) {
  const session = await requireActiveSession("/profile");
  const password = currentPassword.trim();
  if (!password) {
    return { ok: false, message: "Vui lòng nhập mật khẩu hiện tại." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: account, error } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", session.userId)
    .single();

  if (error || !account?.password_hash) {
    return { ok: false, message: "Không kiểm tra được mật khẩu. Vui lòng thử lại." };
  }

  const passwordMatches = await bcrypt.compare(password, account.password_hash);
  if (!passwordMatches) {
    return { ok: false, message: "Mật khẩu hiện tại không đúng." };
  }

  return { ok: true, message: "Mật khẩu hiện tại chính xác." };
}

export async function changePasswordAction({
  currentPassword,
  newPassword,
  confirmPassword,
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const session = await requireActiveSession("/profile");
  const current = currentPassword.trim();
  const next = newPassword.trim();
  const confirm = confirmPassword.trim();

  if (!current || !next || !confirm) {
    return { ok: false, message: "Vui lòng nhập đầy đủ thông tin." };
  }
  if (next.length < 6) {
    return { ok: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự." };
  }
  if (next !== confirm) {
    return { ok: false, message: "Xác nhận mật khẩu mới chưa khớp." };
  }
  if (next === current) {
    return { ok: false, message: "Mật khẩu mới cần khác mật khẩu hiện tại." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: account, error: accountError } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", session.userId)
    .single();

  if (accountError || !account?.password_hash) {
    return { ok: false, message: "Không đổi được mật khẩu. Vui lòng thử lại." };
  }

  const passwordMatches = await bcrypt.compare(current, account.password_hash);
  if (!passwordMatches) {
    return { ok: false, message: "Mật khẩu hiện tại không đúng." };
  }

  const passwordHash = await bcrypt.hash(next, 10);
  const { error } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.userId);

  if (error) {
    return { ok: false, message: "Chưa lưu được mật khẩu mới. Vui lòng thử lại." };
  }

  return { ok: true, message: "Đã đổi mật khẩu thành công." };
}

export async function requestCoachRoleAction(formData: FormData) {
  const session = await requireActiveSession("/profile");
  const specialization = clean(formData.get("specialization"));
  const yearsOfExperience = cleanNumber(formData.get("years_of_experience"));
  const certification = clean(formData.get("certification"));
  const bio = clean(formData.get("bio"));
  const availability = clean(formData.get("availability"));
  const note = clean(formData.get("note"));
  const portfolioFile = fileFromFormData(formData.get("portfolio_file"));

  if (!specialization || !bio) {
    return { ok: false, message: "Vui lòng nhập chuyên môn và giới thiệu bản thân." };
  }

  const supabase = await createSupabaseServerClient();
  if (!portfolioFile) {
    return { ok: false, message: "Vui lòng tải CV hoặc file chứng nhận để admin xét duyệt." };
  }
  if (!isAllowedPtFile(portfolioFile)) {
    return { ok: false, message: "CV/chứng nhận chỉ hỗ trợ PDF, DOC, DOCX, PNG, JPG." };
  }
  if (portfolioFile.size > 8 * 1024 * 1024) {
    return { ok: false, message: "CV/chứng nhận không được quá 8MB." };
  }

  const uploadedPortfolioPath = await uploadPtApplicationFile(supabase, portfolioFile, session.email);
  if (!uploadedPortfolioPath) {
    return { ok: false, message: "Không upload được CV/chứng nhận. Vui lòng thử file khác." };
  }

  const cvNote = `File chứng nhận/CV: ${portfolioFile.name} (${formatFileSize(portfolioFile.size)})${uploadedPortfolioPath.storagePath ? `\nĐường dẫn storage: ${uploadedPortfolioPath.storagePath}` : ""}${uploadedPortfolioPath.publicPath ? `\nĐường dẫn file: ${uploadedPortfolioPath.publicPath}` : ""}`;
  const ptRequestNote = [
    cvNote,
    availability ? `Thời gian có thể dạy: ${availability}` : "",
    note ? `Ghi chú: ${note}` : "",
  ].filter(Boolean).join("\n") || null;

  const updatePayload = {
    requested_role: "coach",
    pt_request_status: "pending",
    specialization,
    years_of_experience: yearsOfExperience,
    certification,
    bio,
    pt_request_note: ptRequestNote,
    updated_at: new Date().toISOString(),
  };

  let result = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", session.userId);

  if (
    result.error &&
    isSchemaColumnError(result.error, ["pt_request_status", "pt_request_note"])
  ) {
    result = await supabase
      .from("users")
      .update({
        requested_role: updatePayload.requested_role,
        specialization: updatePayload.specialization,
        years_of_experience: updatePayload.years_of_experience,
        certification: updatePayload.certification,
        bio: updatePayload.bio,
        updated_at: updatePayload.updated_at,
      })
      .eq("id", session.userId);
  }

  if (result.error) {
    return { ok: false, message: "Chưa gửi được đăng ký HLV. Vui lòng thử lại." };
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "submit_pt_request",
    entityType: "user",
    entityId: session.userId,
    details: { specialization, yearsOfExperience },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/dashboard/admin/enrollments");
  return { ok: true, message: "Đã gửi đăng ký HLV. Admin sẽ xét duyệt hồ sơ của bạn." };
}

export async function linkWalletAction(walletAddress: string) {
  const session = await requireActiveSession("/profile");
  const normalizedWallet = walletAddress.trim().toLowerCase();
  if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedWallet)) {
    return { ok: false, message: "Địa chỉ ví MetaMask không hợp lệ." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("users")
    .update({
      wallet_address: normalizedWallet,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.userId);

  if (error) {
    return { ok: false, message: "Ví này có thể đã được liên kết với tài khoản khác." };
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "link_wallet",
    entityType: "user",
    entityId: session.userId,
    details: { walletAddress: normalizedWallet },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/courses");
  return { ok: true, message: "Đã liên kết ví MetaMask thành công." };
}
