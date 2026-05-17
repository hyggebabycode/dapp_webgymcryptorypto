"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { addCoachScheduleAction } from "@/lib/coach/actions";

type CourseOption = {
  id: string;
  course_name: string;
};

export function AddScheduleDialog({ courses }: { courses: CourseOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-white" onClick={() => setOpen(true)} type="button">
        Tạo lịch dạy
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <form action={addCoachScheduleAction} className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Tạo lịch dạy</h2>
                <p className="mt-1 text-sm text-muted">Lịch mới sẽ xuất hiện trong lịch học của HLV.</p>
              </div>
              <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-black">Khóa học</span>
                <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="course_id" required>
                  <option value="">Chọn khóa học</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.course_name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Tên buổi học</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="title" required />
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Thứ</span>
                <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="day_of_week" defaultValue="1">
                  <option value="1">Thứ hai</option>
                  <option value="2">Thứ ba</option>
                  <option value="3">Thứ tư</option>
                  <option value="4">Thứ năm</option>
                  <option value="5">Thứ sáu</option>
                  <option value="6">Thứ bảy</option>
                  <option value="0">Chủ nhật</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Giờ bắt đầu</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="start_time" required type="time" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Giờ kết thúc</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="end_time" required type="time" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Địa điểm</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="location" placeholder="Phòng Cardio" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Phòng</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="room_number" placeholder="C101" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Sức chứa</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" min="1" name="max_capacity" type="number" defaultValue={20} />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-black">Mô tả</span>
                <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="description" />
              </label>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setOpen(false)} type="button">Hủy</button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">Lưu lịch</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
