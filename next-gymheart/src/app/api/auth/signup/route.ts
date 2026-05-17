import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
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

function isSchemaColumnError(error: unknown, columns: string | string[]) {
  const maybeError = error as { message?: string; details?: string; hint?: string };
  const text = [maybeError.message, maybeError.details, maybeError.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const columnList = Array.isArray(columns) ? columns : [columns];
  return columnList.some((column) => text.includes(column.toLowerCase()));
}

async function uploadPtApplicationFile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  file: File | null,
  email: string,
) {
  if (!file) return null;

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

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const roleRequest = String(formData.get("role") || "user");
  const specialization = String(formData.get("specialization") || "").trim();
  const yearsOfExperience = Number(formData.get("years_of_experience") || 0);
  const certification = String(formData.get("certification") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const availability = String(formData.get("availability") || "").trim();
  const portfolioFile = fileFromFormData(formData.get("portfolio_file"));

  if (!fullName || !email || !phone || !password) {
    return redirectTo(request, "/login?mode=signup&error=signup_missing");
  }

  if (password.length < 6) {
    return redirectTo(request, "/login?mode=signup&error=password_short");
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingUsers } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (existingUsers && existingUsers.length > 0) {
    return redirectTo(request, "/login?mode=signup&error=email_exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const requestedRole = roleRequest === "coach" ? "coach" : null;
  const uploadedPortfolioPath = requestedRole
    ? await uploadPtApplicationFile(supabase, portfolioFile, email)
    : null;

  if (requestedRole && portfolioFile && !uploadedPortfolioPath) {
    return redirectTo(request, "/login?mode=signup&error=upload_failed");
  }

  const ptRequestNote = requestedRole
    ? [
        availability ? `Thời gian có thể dạy: ${availability}` : "",
        portfolioFile
          ? `File chứng nhận/CV: ${portfolioFile.name} (${formatFileSize(portfolioFile.size)})${uploadedPortfolioPath?.storagePath ? `\nĐường dẫn storage: ${uploadedPortfolioPath.storagePath}` : ""}${uploadedPortfolioPath?.publicPath ? `\nĐường dẫn file: ${uploadedPortfolioPath.publicPath}` : ""}`
          : "",
      ].filter(Boolean).join("\n") || null
    : null;
  const signupPayload = {
    email,
    password_hash: passwordHash,
    full_name: fullName,
    phone,
    role: "user",
    requested_role: requestedRole,
    pt_request_status: requestedRole ? "pending" : "none",
    pt_request_note: ptRequestNote,
    specialization: requestedRole ? specialization || null : null,
    years_of_experience: requestedRole && Number.isFinite(yearsOfExperience) ? yearsOfExperience : null,
    certification: requestedRole ? certification || null : null,
    bio: requestedRole ? bio || null : null,
    is_active: true,
  };

  let createResult = await supabase.from("users").insert(signupPayload);

  if (
    createResult.error &&
    isSchemaColumnError(createResult.error, ["pt_request_status", "pt_request_note"])
  ) {
    if (requestedRole) {
      return redirectTo(request, "/login?mode=signup&error=pt_schema_missing");
    }

    createResult = await supabase.from("users").insert({
      email,
      password_hash: passwordHash,
      full_name: fullName,
      phone,
      role: "user",
      requested_role: requestedRole,
      specialization: signupPayload.specialization,
      years_of_experience: signupPayload.years_of_experience,
      certification: signupPayload.certification,
      bio: signupPayload.bio,
      is_active: true,
    });
  }

  if (createResult.error) {
    return redirectTo(request, "/login?mode=signup&error=signup_failed");
  }

  return redirectTo(request, "/login?registered=1");
}
