"use server";

import bcrypt from "bcryptjs";
import { getAddress, isAddress, verifyMessage } from "ethers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionCookie,
  SESSION_COOKIE_NAME,
  type UserRole,
} from "@/lib/auth/session";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const dashboardHrefByRole: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  coach: "/dashboard/coach",
  user: "/dashboard/user",
};
const encoder = new TextEncoder();

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nextPath = String(formData.get("next") || "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, password_hash, full_name, role, is_active")
    .eq("email", email)
    .limit(1);

  if (error || !users || users.length === 0) {
    redirect("/login?error=invalid");
  }

  const user = users[0];
  if (!user.is_active) {
    redirect("/login?error=inactive");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    redirect("/login?error=invalid");
  }

  const role = user.role as UserRole;
  const cookieValue = await createSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });

  if (nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    redirect(nextPath);
  }

  redirect(dashboardHrefByRole[role]);
}

export async function signupAction(formData: FormData) {
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
  const portfolioUrl = String(formData.get("portfolio_url") || "").trim();

  if (!fullName || !email || !phone || !password) {
    redirect("/login?mode=signup&error=signup_missing");
  }

  if (password.length < 6) {
    redirect("/login?mode=signup&error=password_short");
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingUsers } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (existingUsers && existingUsers.length > 0) {
    redirect("/login?mode=signup&error=email_exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const requestedRole = roleRequest === "coach" ? "coach" : null;
  const ptRequestNote = requestedRole
    ? [
        availability ? `Thời gian có thể dạy: ${availability}` : "",
        portfolioUrl ? `Hồ sơ/portfolio: ${portfolioUrl}` : "",
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
    redirect("/login?mode=signup&error=signup_failed");
  }

  redirect("/login?registered=1");
}

function normalizeWalletAddress(value: string) {
  const rawValue = value.trim();
  if (!isAddress(rawValue)) return null;
  return getAddress(rawValue);
}

function walletEmail(walletAddress: string) {
  return `${walletAddress.toLowerCase()}@metamask.gymheart.local`;
}

function walletDisplayName(walletAddress: string) {
  return `MetaMask ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecodeText(value: string) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedValue = normalizedValue.padEnd(
    normalizedValue.length + ((4 - (normalizedValue.length % 4)) % 4),
    "=",
  );
  return Buffer.from(paddedValue, "base64").toString("utf8");
}

function signedMessageFromFormData(formData: FormData) {
  const encodedMessage = String(formData.get("message_b64") || "");
  if (encodedMessage) {
    try {
      return base64UrlDecodeText(encodedMessage);
    } catch {
      return "";
    }
  }

  return String(formData.get("message") || "");
}

async function signWalletChallenge(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.cookieSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createWalletChallengeAction({
  action,
  walletAddress,
}: {
  action: "login" | "signup";
  walletAddress: string;
}) {
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  if (!normalizedWallet) {
    throw new Error("Địa chỉ ví MetaMask không hợp lệ.");
  }

  const nonce = crypto.randomUUID();
  const timestamp = Date.now();
  const challengePayload = `${action}:${normalizedWallet.toLowerCase()}:${nonce}:${timestamp}`;
  const challenge = await signWalletChallenge(challengePayload);

  return [
    `GymHeart ${action} with MetaMask`,
    `Wallet: ${normalizedWallet}`,
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`,
    `Challenge: ${challenge}`,
  ].join("\n");
}

async function setSessionAndRedirect(user: {
  id: string;
  email: string;
  full_name: string;
  role: string;
}) {
  const role = user.role as UserRole;
  const cookieValue = await createSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });

  redirect(dashboardHrefByRole[role]);
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

async function verifyWalletSignature({
  walletAddress,
  message,
  signature,
  action,
}: {
  walletAddress: string;
  message: string;
  signature: string;
  action: "login" | "signup";
}) {
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  if (!normalizedWallet || !message || !signature) return false;

  let recoveredAddress = "";
  try {
    recoveredAddress = verifyMessage(message, signature);
  } catch {
    return false;
  }

  const normalizedRecoveredAddress = normalizeWalletAddress(recoveredAddress);
  if (!normalizedRecoveredAddress || normalizedRecoveredAddress !== normalizedWallet) {
    return false;
  }

  const expectedPrefix = `GymHeart ${action} with MetaMask`;
  const walletLineMatch = message.match(/Wallet:\s*(0x[a-fA-F0-9]{40})/);
  const walletInMessage = normalizeWalletAddress(walletLineMatch?.[1] || "");
  if (!message.includes(expectedPrefix) || walletInMessage !== normalizedWallet) {
    return false;
  }

  const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
  const timestamp = Number(timestampMatch?.[1] || 0);
  const maxAgeMs = 5 * 60 * 1000;

  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > maxAgeMs) {
    return false;
  }

  const nonceMatch = message.match(/Nonce:\s*([a-f0-9-]+)/i);
  const nonce = nonceMatch?.[1] || "";
  const challengeMatch = message.match(/Challenge:\s*([A-Za-z0-9_-]+)/);
  const challenge = challengeMatch?.[1] || "";
  if (!nonce || !challenge) return false;

  const expectedChallenge = await signWalletChallenge(
    `${action}:${normalizedWallet.toLowerCase()}:${nonce}:${timestamp}`,
  );

  return challenge === expectedChallenge;
}

async function attachWalletToLegacyUser(userId: string, walletAddress: string) {
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  if (!normalizedWallet) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("users")
    .update({ wallet_address: normalizedWallet.toLowerCase() })
    .eq("id", userId);

  if (error && !isSchemaColumnError(error, "wallet_address")) {
    throw error;
  }
}

async function findMetaMaskUser(walletAddress: string) {
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  if (!normalizedWallet) return null;

  const supabase = await createSupabaseServerClient();
  const lowerWallet = normalizedWallet.toLowerCase();

  const byWallet = await supabase
    .from("users")
    .select("id, email, full_name, role, is_active")
    .eq("wallet_address", lowerWallet)
    .limit(1);

  if (!byWallet.error && byWallet.data && byWallet.data.length > 0) {
    return byWallet.data[0];
  }

  if (byWallet.error && !isSchemaColumnError(byWallet.error, "wallet_address")) {
    throw byWallet.error;
  }

  const byEmail = await supabase
    .from("users")
    .select("id, email, full_name, role, is_active")
    .eq("email", walletEmail(normalizedWallet))
    .limit(1);

  if (!byEmail.error && byEmail.data && byEmail.data.length > 0) {
    await attachWalletToLegacyUser(byEmail.data[0].id, normalizedWallet);
    return byEmail.data[0];
  }

  if (byEmail.error) throw byEmail.error;

  const byAddress = await supabase
    .from("users")
    .select("id, email, full_name, role, is_active")
    .in("address", [`MetaMask: ${normalizedWallet}`, `MetaMask: ${lowerWallet}`])
    .limit(1);

  if (byAddress.error && !isSchemaColumnError(byAddress.error, "address")) {
    throw byAddress.error;
  }

  const legacyAddressUser = byAddress.data?.[0] || null;
  if (legacyAddressUser) {
    await attachWalletToLegacyUser(legacyAddressUser.id, normalizedWallet);
  }

  return legacyAddressUser;
}

export async function signupWithMetaMaskAction(formData: FormData) {
  const walletAddress = String(formData.get("wallet_address") || "").trim();
  const message = signedMessageFromFormData(formData);
  const signature = String(formData.get("signature") || "");

  if (
    !(await verifyWalletSignature({
      walletAddress,
      message,
      signature,
      action: "signup",
    }))
  ) {
    redirect("/login?mode=signup&error=wallet_invalid");
  }

  const normalizedWallet = normalizeWalletAddress(walletAddress);
  if (!normalizedWallet) {
    redirect("/login?mode=signup&error=wallet_invalid");
  }

  const supabase = await createSupabaseServerClient();
  const existingUser = await findMetaMaskUser(normalizedWallet);

  if (existingUser) {
    const user = existingUser;
    if (!user.is_active) {
      redirect("/login?mode=signup&error=inactive");
    }

    await setSessionAndRedirect(user);
  }

  const passwordHash = await bcrypt.hash(
    `metamask:${walletAddress}:${crypto.randomUUID()}`,
    10,
  );
  const payload = {
    email: walletEmail(normalizedWallet),
    password_hash: passwordHash,
    full_name: walletDisplayName(normalizedWallet),
    phone: null,
    role: "user",
    requested_role: null,
    pt_request_status: "none",
    address: `MetaMask: ${normalizedWallet}`,
    wallet_address: normalizedWallet.toLowerCase(),
    is_active: true,
  };

  let createResult = await supabase
    .from("users")
    .insert(payload)
    .select("id, email, full_name, role")
    .single();

  if (
    createResult.error &&
    isSchemaColumnError(createResult.error, ["wallet_address", "pt_request_status"])
  ) {
    const fallbackPayload = {
      email: payload.email,
      password_hash: payload.password_hash,
      full_name: payload.full_name,
      phone: payload.phone,
      role: payload.role,
      requested_role: payload.requested_role,
      address: payload.address,
      is_active: payload.is_active,
    };
    createResult = await supabase
      .from("users")
      .insert(fallbackPayload)
      .select("id, email, full_name, role")
      .single();
  }

  if (createResult.error || !createResult.data) {
    redirect("/login?mode=signup&error=wallet_signup_failed");
  }

  await setSessionAndRedirect(createResult.data);
}

export async function loginWithMetaMaskAction(formData: FormData) {
  const walletAddress = String(formData.get("wallet_address") || "").trim();
  const message = signedMessageFromFormData(formData);
  const signature = String(formData.get("signature") || "");

  if (
    !(await verifyWalletSignature({
      walletAddress,
      message,
      signature,
      action: "login",
    }))
  ) {
    redirect("/login?error=wallet_invalid");
  }

  const user = await findMetaMaskUser(walletAddress);

  if (!user) {
    redirect("/login?error=wallet_not_registered");
  }

  if (!user.is_active) {
    redirect("/login?error=inactive");
  }

  await setSessionAndRedirect(user);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
