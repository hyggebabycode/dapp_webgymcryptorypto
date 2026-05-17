"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";
import { addUserAction } from "@/lib/admin/actions";

export function AddUserDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-white hover:opacity-90"
        onClick={() => setOpen(true)}
        type="button"
      >
        Thêm người dùng
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <form action={addUserAction} className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Thêm người dùng</h2>
                <p className="mt-1 text-sm text-muted">Tài khoản mới sẽ được lưu vào Supabase.</p>
              </div>
              <button
                aria-label="Đóng"
                className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={22} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <label className="block">
                <span className="mb-2 block text-sm font-black">Họ tên</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="full_name" required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black">Email</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="email" required type="email" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black">Số điện thoại</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="phone" />
              </label>
              <PasswordField
                inputClassName="bg-white"
                defaultValue="123456"
                label="Mật khẩu ban đầu"
                minLength={6}
                name="password"
                placeholder="123456"
              />
              <label className="block">
                <span className="mb-2 block text-sm font-black">Vai trò</span>
                <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="role" defaultValue="user">
                  <option value="user">User</option>
                  <option value="coach">Coach</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setOpen(false)} type="button">
                Hủy
              </button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">
                Lưu người dùng
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
