"use server";

import { ethers } from "ethers";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { requireActiveSession } from "@/lib/auth/guards";
import { baseAmountToTest } from "@/lib/currency";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RecordWeb3PaymentInput = {
  courseId: string;
  txHash: string;
  walletAddress: string;
};

const PAYMENT_ABI = [
  "function payForCourse(uint256 courseId) payable",
  "event CoursePaid(address indexed student, uint256 indexed courseId, uint256 amount)",
] as const;

function isSchemaColumnError(error: unknown, columns: string[]) {
  const maybeError = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
  const text = [
    maybeError?.code,
    maybeError?.message,
    maybeError?.details,
    maybeError?.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return columns.some((column) => text.includes(column.toLowerCase()));
}

function courseUuidToUint256(courseId: string) {
  return BigInt(`0x${courseId.replace(/-/g, "")}`).toString();
}

async function verifyPaymentTransaction({
  courseId,
  expectedPrice,
  txHash,
  walletAddress,
}: {
  courseId: string;
  expectedPrice: number;
  txHash: string;
  walletAddress: string;
}) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    throw new Error("Mã giao dịch không hợp lệ.");
  }

  const provider = new ethers.JsonRpcProvider(env.sapphireRpcUrl);
  const [tx, receipt] = await Promise.all([
    provider.getTransaction(txHash),
    provider.getTransactionReceipt(txHash),
  ]);

  if (!tx || !receipt) {
    throw new Error("Chưa tìm thấy giao dịch trên Oasis Sapphire.");
  }

  if (receipt.status !== 1) {
    throw new Error("Giao dịch on-chain không thành công.");
  }

  const expectedContract = env.paymentContractAddress.toLowerCase();
  if (!tx.to || tx.to.toLowerCase() !== expectedContract) {
    throw new Error("Giao dịch không gửi đến đúng smart contract.");
  }

  if (tx.from.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error("Ví thanh toán không khớp giao dịch.");
  }

  const paymentInterface = new ethers.Interface(PAYMENT_ABI);
  const parsedTx = paymentInterface.parseTransaction({
    data: tx.data,
    value: tx.value,
  });

  if (!parsedTx || parsedTx.name !== "payForCourse") {
    throw new Error("Giao dịch không gọi hàm payForCourse.");
  }

  const expectedCourseId = courseUuidToUint256(courseId);
  if (parsedTx.args[0].toString() !== expectedCourseId) {
    throw new Error("Mã khóa học on-chain không khớp.");
  }

  const expectedTokenAmount = baseAmountToTest(expectedPrice)
    .toFixed(18)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
  const expectedValue = ethers.parseEther(expectedTokenAmount);

  if (tx.value < expectedValue) {
    throw new Error("Số TEST thanh toán thấp hơn học phí.");
  }

  return expectedTokenAmount;
}

export async function recordWeb3PaymentAction(input: RecordWeb3PaymentInput) {
  const session = await requireActiveSession("/courses");

  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const [{ data: course, error: courseError }, { data: user, error: userError }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, price, is_active, current_students, max_students")
      .eq("id", input.courseId)
      .single(),
    supabase
      .from("users")
      .select("wallet_address")
      .eq("id", session.userId)
      .maybeSingle(),
  ]);

  if (courseError || !course) {
    throw new Error("Không tìm thấy khóa học.");
  }

  if (userError || !user?.wallet_address) {
    throw new Error("Vui lòng liên kết ví MetaMask trước khi thanh toán.");
  }

  if (String(user.wallet_address).toLowerCase() !== input.walletAddress.toLowerCase()) {
    throw new Error("Ví thanh toán không khớp ví đã liên kết với tài khoản.");
  }

  if (!course.is_active) {
    throw new Error("Khóa học này hiện không mở đăng ký.");
  }

  if (Number(course.current_students || 0) >= Number(course.max_students || 0)) {
    throw new Error("Khóa học đã đủ số lượng học viên.");
  }

  const existingEnrollment = await supabase
    .from("class_enrollments")
    .select("id, status, payment_status")
    .eq("user_id", session.userId)
    .eq("course_id", input.courseId)
    .maybeSingle();

  if (existingEnrollment.error) throw existingEnrollment.error;

  if (
    existingEnrollment.data?.payment_status === "paid" &&
    ["active", "completed"].includes(existingEnrollment.data.status)
  ) {
    throw new Error("Bạn đã thanh toán khóa học này.");
  }

  const tokenAmount = await verifyPaymentTransaction({
    courseId: input.courseId,
    expectedPrice: Number(course.price || 0),
    txHash: input.txHash,
    walletAddress: input.walletAddress,
  });

  const existingTx = await supabase
    .from("class_enrollments")
    .select("id, user_id, course_id")
    .eq("tx_hash", input.txHash)
    .maybeSingle();

  if (existingTx.error && !isSchemaColumnError(existingTx.error, ["tx_hash"])) {
    throw existingTx.error;
  }

  if (
    existingTx.data &&
    (existingTx.data.user_id !== session.userId || existingTx.data.course_id !== input.courseId)
  ) {
    throw new Error("Mã giao dịch này đã được ghi nhận cho đăng ký khác.");
  }

  const buildPayload = (includeWeb3Columns: boolean) => {
    const payload: Record<string, string | number> = {
      enrollment_date: now,
      status: "active",
      payment_status: "paid",
      payment_method: "metamask_sapphire",
      payment_amount: Number(course.price || 0),
      payment_date: now,
      notes: `Thanh toán ${tokenAmount} TEST trên Oasis Sapphire. Ví: ${input.walletAddress}. Tx: ${input.txHash}`,
    };

    if (includeWeb3Columns) {
      payload.tx_hash = input.txHash;
      payload.payment_token_amount = Number(tokenAmount);
      payload.payment_currency = "TEST";
      payload.payer_wallet = input.walletAddress.toLowerCase();
    }

    return payload;
  };

  const save = async (includeWeb3Columns: boolean) => {
    if (existingEnrollment.data) {
      const { error } = await supabase
        .from("class_enrollments")
        .update(buildPayload(includeWeb3Columns))
        .eq("id", existingEnrollment.data.id);

      if (error) throw error;
      return existingEnrollment.data.id as string;
    }

    const { data: createdEnrollment, error } = await supabase.from("class_enrollments").insert({
      user_id: session.userId,
      course_id: input.courseId,
      ...buildPayload(includeWeb3Columns),
    }).select("id").single();

    if (error) throw error;
    return createdEnrollment.id as string;
  };

  let savedEnrollmentId = existingEnrollment.data?.id || "";
  try {
    savedEnrollmentId = await save(true);
  } catch (error) {
    if (!isSchemaColumnError(error, ["tx_hash", "payment_token_amount", "payment_currency", "payer_wallet"])) {
      throw error;
    }

    savedEnrollmentId = await save(false);
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "record_web3_payment",
    entityType: "enrollment",
    entityId: savedEnrollmentId,
    details: {
      courseId: input.courseId,
      txHash: input.txHash,
      walletAddress: input.walletAddress.toLowerCase(),
      tokenAmount,
    },
  });

  const cartClear = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", session.userId)
    .eq("course_id", input.courseId);

  if (cartClear.error && !isSchemaColumnError(cartClear.error, ["cart_items"])) {
    throw cartClear.error;
  }

  revalidatePath("/cart");
  revalidatePath("/courses");
  revalidatePath("/my-courses");
  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/enrollments");

  return { ok: true };
}
