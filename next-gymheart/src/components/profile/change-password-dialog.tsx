"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, KeyRound, Lock, X } from "lucide-react";
import {
  changePasswordAction,
  verifyCurrentPasswordAction,
} from "@/lib/profile/actions";

type Step = "current" | "new";

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("current");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDialog();
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function closeDialog() {
    setOpen(false);
    setStep("current");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
    setSuccess(false);
  }

  function verifyCurrentPassword() {
    setMessage(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await verifyCurrentPasswordAction(currentPassword);
      setMessage(result.message);
      setSuccess(result.ok);
      if (result.ok) {
        setStep("new");
        setMessage(null);
        setSuccess(false);
      }
    });
  }

  function changePassword() {
    setMessage(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setMessage(result.message);
      setSuccess(result.ok);
      if (result.ok) {
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  }

  return (
    <>
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary bg-white px-5 text-sm font-black text-primary hover:bg-primary-soft"
        onClick={() => setOpen(true)}
        type="button"
      >
        <KeyRound size={17} />
        Đổi mật khẩu
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4">
          <button
            aria-label="Đóng đổi mật khẩu"
            className="absolute inset-0"
            onClick={closeDialog}
            type="button"
          />
          <section className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Đổi mật khẩu</h2>
                <p className="mt-1 text-sm text-muted">
                  {step === "current" ? "Xác nhận mật khẩu hiện tại trước." : "Nhập mật khẩu mới và xác nhận."}
                </p>
              </div>
              <button
                aria-label="Đóng"
                className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                onClick={closeDialog}
                type="button"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {message ? (
                <div className={`rounded-lg px-4 py-3 text-sm font-bold ${success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message}
                </div>
              ) : null}

              {step === "current" ? (
                <>
                  <PasswordInput
                    autoComplete="current-password"
                    label="Mật khẩu hiện tại"
                    onChange={setCurrentPassword}
                    value={currentPassword}
                  />
                  <button
                    className="h-11 w-full rounded-lg bg-primary font-black text-white disabled:opacity-60"
                    disabled={isPending}
                    onClick={verifyCurrentPassword}
                    type="button"
                  >
                    {isPending ? "Đang kiểm tra..." : "Tiếp tục"}
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                    <CheckCircle2 className="mr-2 inline text-green-600" size={17} />
                    Mật khẩu hiện tại chính xác.
                  </div>
                  <PasswordInput
                    autoComplete="new-password"
                    label="Mật khẩu mới"
                    onChange={setNewPassword}
                    value={newPassword}
                  />
                  <PasswordInput
                    autoComplete="new-password"
                    label="Xác nhận mật khẩu mới"
                    onChange={setConfirmPassword}
                    value={confirmPassword}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="h-11 rounded-lg border border-primary bg-white font-black text-primary"
                      onClick={() => {
                        setStep("current");
                        setMessage(null);
                        setSuccess(false);
                      }}
                      type="button"
                    >
                      Quay lại
                    </button>
                    <button
                      className="h-11 rounded-lg bg-primary font-black text-white disabled:opacity-60"
                      disabled={isPending}
                      onClick={changePassword}
                      type="button"
                    >
                      {isPending ? "Đang lưu..." : "Xác nhận"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function PasswordInput({
  autoComplete,
  label,
  onChange,
  value,
}: {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black">{label}</span>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          autoComplete={autoComplete}
          className="h-12 w-full rounded-lg border border-pink-200 bg-white pl-11 pr-4 outline-none focus:border-primary"
          minLength={6}
          onChange={(event) => onChange(event.target.value)}
          type="password"
          value={value}
        />
      </div>
    </label>
  );
}
