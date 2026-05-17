"use client";

import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { useWeb3Payment } from "@/hooks/useWeb3Payment";
import { formatBaseAsTest } from "@/lib/currency";

export function Web3Button({
  course,
}: {
  course: { id: string; price: number; course_name: string };
}) {
  const router = useRouter();
  const { contractAddress, isPaying, payCourse, status } = useWeb3Payment();

  return (
    <div className="rounded-xl border border-border-soft bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black">Thanh toán bằng MetaMask</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Xác nhận giao dịch trên Oasis Sapphire Testnet để hoàn tất đăng ký khóa học.
        </p>
      </div>

      <div className="mb-4 rounded-lg bg-primary-soft p-4 text-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-bold text-muted">Số TEST cần thanh toán</span>
          <span className="font-black text-primary">{formatBaseAsTest(course.price)}</span>
        </div>
        <p className="font-bold text-muted">Địa chỉ hợp đồng</p>
        <p className="mt-1 break-all font-mono text-xs">{contractAddress}</p>
      </div>

      {status ? (
        <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {status}
        </div>
      ) : null}

      <button
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-black text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPaying}
        onClick={async () => {
          await payCourse(course);
          router.refresh();
        }}
        type="button"
      >
        <Wallet size={18} />
        {isPaying ? "Đang xử lý..." : "Thanh toán Token"}
      </button>
    </div>
  );
}
