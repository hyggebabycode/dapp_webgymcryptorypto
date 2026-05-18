"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, RefreshCcw, Wallet } from "lucide-react";
import { compactAddress } from "@/lib/currency";
import { linkWalletAction } from "@/lib/profile/actions";

declare global {
  interface Window {
    ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
  }
}

export function ProfileWalletCard({ walletAddress }: { walletAddress: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function connectWallet() {
    setMessage(null);
    startTransition(async () => {
      try {
        const ethereum = window.ethereum;
        if (!ethereum) {
          setMessage("Chưa thấy MetaMask trong trình duyệt.");
          return;
        }

        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        const nextWalletAddress = Array.isArray(accounts) ? String(accounts[0] || "") : "";
        const result = await linkWalletAction(nextWalletAddress);
        setMessage(result.message);
        if (result.ok) router.refresh();
      } catch {
        setMessage("Không liên kết được ví. Vui lòng thử lại.");
      }
    });
  }

  return (
    <div className="mt-6 rounded-xl border border-pink-100 bg-primary-soft p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-lg font-black">
            <Wallet className="text-primary" size={20} />
            Ví MetaMask
          </h3>
          {walletAddress ? (
            <div className="mt-2 space-y-1">
              <p className="flex items-center gap-2 text-sm font-bold text-green-700">
                <CheckCircle2 size={16} />
                Đã liên kết ví thanh toán
              </p>
              <p className="break-all font-mono text-sm text-muted" title={walletAddress}>
                {compactAddress(walletAddress, 10, 8)}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Chưa có ví thanh toán. Liên kết MetaMask để đăng ký và thanh toán khóa học Web3.
            </p>
          )}
        </div>

        <button
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-white hover:opacity-90 disabled:opacity-60"
          disabled={isPending}
          onClick={connectWallet}
          type="button"
        >
          <RefreshCcw size={16} />
          {isPending ? "Đang kết nối..." : walletAddress ? "Cập nhật ví" : "Liên kết ví"}
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-lg bg-white px-4 py-3 text-sm font-bold text-primary">
          {message}
        </div>
      ) : null}
    </div>
  );
}
