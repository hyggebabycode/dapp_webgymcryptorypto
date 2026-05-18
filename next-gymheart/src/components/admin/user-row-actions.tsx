"use client";

import { useState } from "react";
import { Eye, FileText, Pencil, Power, Trash2, X } from "lucide-react";
import {
  deleteUserAction,
  toggleUserStatusAction,
  updateUserAction,
} from "@/lib/admin/actions";
import { PasswordField } from "@/components/auth/password-field";

export type AdminUserRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  requested_role: string | null;
  specialization: string | null;
  years_of_experience: number | null;
  certification: string | null;
  is_active: boolean;
  created_at: string | null;
  pt_request_note?: string | null;
  cvSignedUrl?: string | null;
  cvLabel?: string | null;
};

type Props = {
  user: AdminUserRecord;
  mode?: "users" | "coaches";
};

export function UserRowActions({ user, mode = "users" }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const isAdmin = user.role === "admin";
  const showCvSection = mode === "coaches";

  return (
    <div className="grid w-[236px] grid-cols-2 gap-2 text-xs font-black">
      <button
        className="inline-flex h-9 w-[112px] items-center justify-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
        onClick={() => setDetailOpen(true)}
        type="button"
      >
        <Eye size={14} />
        Chi tiết
      </button>
      <button
        className="inline-flex h-9 w-[112px] items-center justify-center gap-1.5 rounded-lg border border-pink-100 bg-white text-primary hover:bg-primary-soft"
        onClick={() => setEditOpen(true)}
        type="button"
      >
        <Pencil size={14} />
        Sửa
      </button>
      <form
        action={toggleUserStatusAction}
        onSubmit={(event) => {
          if (!window.confirm(`${user.is_active ? "Vô hiệu hóa" : "Kích hoạt"} tài khoản ${user.full_name}?`)) {
            event.preventDefault();
          }
        }}
      >
        <input name="user_id" type="hidden" value={user.id} />
        <input name="next_active" type="hidden" value={String(!user.is_active)} />
        <input name="redirect_to" type="hidden" value={mode} />
        <button
          className="inline-flex h-9 w-[112px] items-center justify-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100"
          type="submit"
        >
          <Power size={14} />
          {user.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
        </button>
      </form>
      {!isAdmin ? (
        <form
          action={deleteUserAction}
          onSubmit={(event) => {
            if (!window.confirm(`Lưu trữ tài khoản ${user.full_name}? Tài khoản sẽ không đăng nhập được nữa.`)) {
              event.preventDefault();
            }
          }}
        >
          <input name="user_id" type="hidden" value={user.id} />
          <input name="redirect_to" type="hidden" value={mode} />
          <button
            className="inline-flex h-9 w-[112px] items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
            type="submit"
          >
            <Trash2 size={14} />
            Lưu trữ
          </button>
        </form>
      ) : null}

      {detailOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">{user.full_name}</h2>
                <p className="mt-1 text-sm text-muted">{user.email}</p>
              </div>
              <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setDetailOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="grid gap-4 p-6 text-sm md:grid-cols-2">
              <Info label="Vai trò" value={user.role.toUpperCase()} />
              <Info label="Trạng thái" value={user.is_active ? "Active" : "Đã khóa"} />
              <Info label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
              <Info label="Yêu cầu" value={user.requested_role || "-"} />
              <Info label="Chuyên môn" value={user.specialization || "Chưa cập nhật"} />
              <Info label="Kinh nghiệm" value={`${user.years_of_experience ?? 0} năm`} />
              <Info className="md:col-span-2" label="Chứng chỉ" value={user.certification || "Chưa cập nhật"} />
              <Info className="md:col-span-2" label="Giới thiệu" value={user.bio || "Chưa cập nhật"} />
              {showCvSection ? (
                <div className="rounded-xl bg-background p-4 md:col-span-2">
                  <p className="text-xs font-black uppercase text-muted">CV / file chứng nhận</p>
                  {user.cvSignedUrl ? (
                    <a
                      className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-white"
                      href={user.cvSignedUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <FileText size={16} />
                      Xem CV / chứng nhận
                    </a>
                  ) : user.cvLabel ? (
                    <p className="mt-2 text-sm font-bold text-muted">
                      Ứng viên có gửi file: {user.cvLabel}. Chưa tạo được link xem file.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm font-bold text-muted">
                      Chưa tìm thấy file CV/chứng nhận trong hệ thống.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <form action={updateUserAction} className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Sửa tài khoản</h2>
                <p className="mt-1 text-sm text-muted">Cập nhật thông tin người dùng hoặc huấn luyện viên.</p>
              </div>
              <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setEditOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-6">
              <input name="user_id" type="hidden" value={user.id} />
              <input name="redirect_to" type="hidden" value={mode} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Họ tên" name="full_name" defaultValue={user.full_name} required />
                <Field label="Email" name="email" defaultValue={user.email} required type="email" />
                <Field label="Số điện thoại" name="phone" defaultValue={user.phone || ""} />
                <label>
                  <span className="mb-2 block text-sm font-black">Vai trò</span>
                  <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="role" defaultValue={user.role} disabled={isAdmin}>
                    <option value="user">User</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                  {isAdmin ? <input name="role" type="hidden" value="admin" /> : null}
                </label>
                <PasswordField
                  inputClassName="bg-white"
                  label="Mật khẩu mới"
                  name="password"
                  placeholder="Để trống nếu không đổi"
                  required={false}
                />
                <Field label="Ảnh đại diện" name="avatar_url" defaultValue={user.avatar_url || ""} placeholder="https://..." />
                <label>
                  <span className="mb-2 block text-sm font-black">Chọn ảnh mới từ máy</span>
                  <input className="w-full rounded-lg border border-pink-100 bg-white px-4 py-2 text-sm outline-none focus:border-primary" name="avatar_file" accept="image/*" type="file" />
                </label>
                <Field label="Chuyên môn" name="specialization" defaultValue={user.specialization || ""} />
                <Field label="Số năm kinh nghiệm" name="years_of_experience" defaultValue={String(user.years_of_experience ?? 0)} type="number" />
                <Field className="md:col-span-2" label="Chứng chỉ" name="certification" defaultValue={user.certification || ""} />
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Giới thiệu</span>
                  <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="bio" defaultValue={user.bio || ""} />
                </label>
              </div>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setEditOpen(false)} type="button">
                Hủy
              </button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  className,
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

function Info({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={`rounded-xl bg-background p-4 ${className}`}>
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
