"use client";

import { useState } from "react";
import { Bell, CheckCircle2, X } from "lucide-react";

export function NotificationButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-label="Thông báo"
        className="relative inline-flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Bell size={18} />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-white" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-pink-100 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-black">Thông báo</h3>
            <button
              aria-label="Đóng thông báo"
              className="text-muted hover:text-primary"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl bg-primary-soft p-3">
              <p className="flex items-center gap-2 text-sm font-black text-primary">
                <CheckCircle2 size={16} />
                GymHeart đã sẵn sàng
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Bạn có thể tìm khóa học, thêm vào giỏ hàng và thanh toán bằng MetaMask.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
