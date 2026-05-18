"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Dumbbell, UserRound, Wallet, X } from "lucide-react";
import { linkWalletAction, requestCoachRoleAction } from "@/lib/profile/actions";

type MemberInfo = {
  fullName: string;
  role: string;
  avatarUrl: string | null;
  walletAddress: string | null;
  requestedRole: string | null;
  ptRequestStatus: string | null;
};

declare global {
  interface Window {
    ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
  }
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function compactWallet(value: string | null) {
  if (!value) return "Chưa liên kết ví";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function MemberAccountMenu({ member }: { member: MemberInfo }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isRegularUser = member.role === "user";
  const hasPtRequest = member.requestedRole === "coach" || ["pending", "approved"].includes(member.ptRequestStatus || "");

  function connectWallet() {
    setMessage(null);
    startTransition(async () => {
      try {
        const ethereum = window.ethereum as
          | { request(args: { method: string; params?: unknown[] }): Promise<unknown> }
          | undefined;
        if (!ethereum) {
          setMessage("Chưa thấy MetaMask trong trình duyệt.");
          return;
        }

        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        const walletAddress = Array.isArray(accounts) ? String(accounts[0] || "") : "";
        const result = await linkWalletAction(walletAddress);
        setMessage(result.message);
        if (result.ok) router.refresh();
      } catch {
        setMessage("Không liên kết được ví. Vui lòng thử lại.");
      }
    });
  }

  function submitCoachRequest(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await requestCoachRoleAction(formData);
      setMessage(result.message);
      if (result.ok) {
        setCoachOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="relative">
      <button
        className="inline-flex size-10 items-center justify-center overflow-hidden rounded-full bg-primary bg-cover bg-center text-sm font-black text-white ring-2 ring-white"
        onClick={() => setOpen((value) => !value)}
        style={member.avatarUrl ? { backgroundImage: `url(${member.avatarUrl})` } : undefined}
        title="Tài khoản"
        type="button"
      >
        {member.avatarUrl ? <span className="sr-only">{member.fullName}</span> : initials(member.fullName)}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-pink-100 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {member.avatarUrl ? (
                <span
                  className="inline-flex size-11 shrink-0 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${member.avatarUrl})` }}
                />
              ) : (
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                  {initials(member.fullName)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-black">{member.fullName}</p>
                <p className="mt-1 truncate text-xs font-bold text-muted">{compactWallet(member.walletAddress)}</p>
              </div>
            </div>
            <button className="text-muted hover:text-primary" onClick={() => setOpen(false)} type="button">
              <X size={18} />
            </button>
          </div>

          {message ? (
            <div className="mb-3 rounded-lg bg-primary-soft px-3 py-2 text-xs font-bold text-primary">
              {message}
            </div>
          ) : null}

          <div className="space-y-2">
            <Link
              className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-black hover:bg-primary-soft"
              href="/profile"
              onClick={() => setOpen(false)}
            >
              <UserRound size={16} />
              Hồ sơ cá nhân
            </Link>

            {isRegularUser ? (
              <>
                <button
                  className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-black hover:bg-primary-soft disabled:opacity-60"
                  disabled={isPending}
                  onClick={connectWallet}
                  type="button"
                >
                  <Wallet size={16} />
                  {member.walletAddress ? "Cập nhật ví MetaMask" : "Liên kết ví MetaMask"}
                </button>
                <button
                  className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-black hover:bg-primary-soft disabled:opacity-60"
                  disabled={hasPtRequest}
                  onClick={() => {
                    setOpen(false);
                    setCoachOpen(true);
                  }}
                  type="button"
                >
                  <Dumbbell size={16} />
                  {hasPtRequest ? "Đã gửi đăng ký HLV" : "Đăng ký làm HLV"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {coachOpen && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/55 p-4 sm:p-6">
          <button className="fixed inset-0" onClick={() => setCoachOpen(false)} type="button" />
          <div className="relative flex min-h-full items-start justify-center py-4 sm:items-center">
          <form action={submitCoachRequest} className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-pink-100 bg-white px-5 py-4 sm:px-6 sm:py-5">
              <div>
                <h2 className="text-2xl font-black">Đăng ký làm HLV</h2>
                <p className="mt-1 text-sm text-muted">Điền hồ sơ để admin xét duyệt quyền huấn luyện viên.</p>
              </div>
              <button className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setCoachOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-black">CV / file chứng nhận</span>
                <input
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="block min-h-20 w-full rounded-lg border border-pink-100 bg-white px-4 py-3 text-sm font-bold text-muted outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-black file:text-white focus:border-primary"
                  name="portfolio_file"
                  required
                  type="file"
                />
                <p className="mt-2 text-xs font-bold text-muted">Hỗ trợ PDF, DOC, DOCX hoặc ảnh chứng nhận tối đa 8MB.</p>
              </label>
              <Field label="Chuyên môn" name="specialization" placeholder="Fitness, Yoga, Boxing..." required />
              <Field label="Số năm kinh nghiệm" min={0} name="years_of_experience" type="number" defaultValue={0} />
              <Field className="md:col-span-2" label="Chứng chỉ" name="certification" placeholder="ACE, NASM, Yoga Alliance..." />
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-black">Giới thiệu bản thân</span>
                <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="bio" required />
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Thời gian có thể dạy</span>
                <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="availability" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Ghi chú</span>
                <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="note" />
              </label>
            </div>
            <div className="sticky bottom-0 z-10 flex gap-3 border-t border-pink-100 bg-primary-soft p-5 sm:p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setCoachOpen(false)} type="button">
                Hủy
              </button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white disabled:opacity-60" disabled={isPending} type="submit">
                {isPending ? "Đang gửi..." : "Gửi đăng ký"}
              </button>
            </div>
          </form>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

function Field({
  className = "",
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-black">{label}</span>
      <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" {...props} />
    </label>
  );
}
