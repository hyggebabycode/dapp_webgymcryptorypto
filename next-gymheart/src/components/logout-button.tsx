"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-soft px-4 text-sm font-black text-primary hover:bg-[#ffe1e9]"
      onClick={() => {
        window.location.replace("/logout");
      }}
      type="button"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">Đăng xuất</span>
    </button>
  );
}
