"use client";

import { useState } from "react";

export function SignupRoleFields() {
  const [role, setRole] = useState<"user" | "coach">("user");
  const isCoach = role === "coach";

  return (
    <>
      <div>
        <label className="mb-3 block text-sm font-black">Loại tài khoản</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-pink-200 bg-white px-4 py-3 text-sm font-bold">
            <input
              className="size-5 accent-primary"
              checked={role === "user"}
              name="role"
              onChange={() => setRole("user")}
              type="radio"
              value="user"
            />
            Thành viên
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-pink-200 bg-white px-4 py-3 text-sm font-bold">
            <input
              className="size-5 accent-primary"
              checked={role === "coach"}
              name="role"
              onChange={() => setRole("coach")}
              type="radio"
              value="coach"
            />
            Huấn luyện viên (PT)
          </label>
        </div>
        <p className="mt-2 text-xs font-bold text-muted">
          Nếu đăng ký làm PT, yêu cầu sẽ được gửi đến Admin để xét duyệt.
        </p>
      </div>

      {isCoach ? (
        <div className="rounded-xl border border-pink-100 bg-white p-4">
          <div className="mb-4">
            <h3 className="font-black">Hồ sơ ứng tuyển PT</h3>
            <p className="mt-1 text-xs font-bold text-muted">
              Chỉ hiển thị khi bạn chọn “Huấn luyện viên (PT)”. Admin sẽ xem các thông tin này trước khi duyệt.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-black">Chuyên môn</span>
              <input
                className="h-12 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 outline-none focus:border-primary"
                name="specialization"
                placeholder="Fitness, Yoga, Boxing..."
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-black">Số năm kinh nghiệm</span>
              <input
                className="h-12 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 outline-none focus:border-primary"
                min="0"
                name="years_of_experience"
                type="number"
                defaultValue={0}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-black">Chứng chỉ</span>
              <input
                className="h-12 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 outline-none focus:border-primary"
                name="certification"
                placeholder="ACE, NASM, ISSA, Yoga Alliance..."
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-black">Giới thiệu kinh nghiệm</span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 py-3 outline-none focus:border-primary"
                name="bio"
                placeholder="Bạn từng huấn luyện nhóm học viên nào, thế mạnh là gì, phong cách giảng dạy ra sao?"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-black">Thời gian có thể dạy</span>
              <textarea
                className="min-h-20 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 py-3 outline-none focus:border-primary"
                name="availability"
                placeholder="VD: Tối T2-T6, sáng cuối tuần"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-black">File chứng nhận / CV chi tiết</span>
              <input
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="block min-h-20 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 py-3 text-sm font-bold text-muted outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-black file:text-white focus:border-primary"
                name="portfolio_file"
                required
                type="file"
              />
              <p className="mt-2 text-xs font-bold text-muted">
                Hỗ trợ PDF, DOC, DOCX hoặc ảnh chứng nhận.
              </p>
            </label>
          </div>
        </div>
      ) : null}
    </>
  );
}
