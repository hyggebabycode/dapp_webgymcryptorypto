"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";
import { addPtRequestAction } from "@/lib/admin/actions";

export function AddPtRequestDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-black text-white hover:opacity-90"
        onClick={() => setOpen(true)}
        type="button"
      >
        Thêm yêu cầu PT
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <form action={addPtRequestAction} className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl" encType="multipart/form-data">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Yêu cầu đăng ký làm PT</h2>
                <p className="mt-1 text-sm text-muted">Tạo yêu cầu chờ duyệt cho ứng viên huấn luyện viên.</p>
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
            <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black">Tên ứng viên</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="full_name" placeholder="Nguyễn Văn A" required />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Email</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="email" placeholder="coach@email.com" required type="email" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Số điện thoại</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="phone" placeholder="0901234567" />
                </label>
                <PasswordField
                  inputClassName="bg-white"
                  defaultValue="123456"
                  label="Mật khẩu ban đầu"
                  minLength={6}
                  name="password"
                />
                <label>
                  <span className="mb-2 block text-sm font-black">Ngày sinh</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="date_of_birth" type="date" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Giới tính</span>
                  <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="gender" defaultValue="">
                    <option value="">Chưa chọn</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Địa chỉ</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="address" placeholder="Khu vực sinh sống hoặc nơi có thể làm việc" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Chuyên môn chính</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="specialization" placeholder="Fitness, Yoga, Boxing, giảm cân..." />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Số năm kinh nghiệm</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" min="0" name="years_of_experience" type="number" defaultValue={0} />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Chứng chỉ</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="certification" placeholder="ACE, NASM, ISSA, Yoga Alliance..." />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Ảnh đại diện / hồ sơ ảnh</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="avatar_url" placeholder="https://..." />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Chọn ảnh từ máy</span>
                  <input className="w-full rounded-lg border border-pink-100 bg-white px-4 py-2 text-sm outline-none focus:border-primary" name="avatar_file" accept="image/*" type="file" />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Giới thiệu bản thân</span>
                  <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="bio" placeholder="Kinh nghiệm huấn luyện, nhóm học viên đã từng hỗ trợ, phong cách giảng dạy..." />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Thời gian có thể dạy</span>
                  <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="availability" placeholder="VD: Tối T2-T6, sáng T7-CN" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Link hồ sơ / portfolio</span>
                  <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="portfolio_url" placeholder="Facebook, website cá nhân, chứng chỉ online..." />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Ghi chú xét duyệt</span>
                  <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="note" placeholder="Thông tin admin cần lưu khi xét duyệt yêu cầu này." />
                </label>
              </div>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setOpen(false)} type="button">
                Hủy
              </button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">
                Lưu yêu cầu
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
