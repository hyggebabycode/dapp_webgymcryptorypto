"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { deleteCoachScheduleAction, updateCoachScheduleAction } from "@/lib/coach/actions";

type CourseOption = {
  id: string;
  course_name: string;
};

export type CoachScheduleRecord = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
  room_number: string | null;
  max_capacity: number | null;
};

export function CoachScheduleActions({ courses, schedule }: { courses: CourseOption[]; schedule: CoachScheduleRecord }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="mt-4 flex gap-2">
      <button className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-50" onClick={() => setEditOpen(true)} type="button">
        Sửa
      </button>
      <form
        action={deleteCoachScheduleAction}
        onSubmit={(event) => {
          if (!window.confirm(`Xóa lịch ${schedule.title}?`)) event.preventDefault();
        }}
      >
        <input name="schedule_id" type="hidden" value={schedule.id} />
        <button className="rounded-lg border border-red-100 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50" type="submit">
          Xóa
        </button>
      </form>

      {editOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <form action={updateCoachScheduleAction} className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Sửa lịch dạy</h2>
                <p className="mt-1 text-sm text-muted">Cập nhật thời gian, địa điểm và mô tả buổi học.</p>
              </div>
              <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setEditOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <input name="schedule_id" type="hidden" value={schedule.id} />
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-black">Khóa học</span>
                <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="course_id" required defaultValue={schedule.course_id}>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.course_name}</option>
                  ))}
                </select>
              </label>
              <Field label="Tên buổi học" name="title" defaultValue={schedule.title} required />
              <label>
                <span className="mb-2 block text-sm font-black">Thứ</span>
                <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="day_of_week" defaultValue={String(schedule.day_of_week)}>
                  <option value="1">Thứ hai</option>
                  <option value="2">Thứ ba</option>
                  <option value="3">Thứ tư</option>
                  <option value="4">Thứ năm</option>
                  <option value="5">Thứ sáu</option>
                  <option value="6">Thứ bảy</option>
                  <option value="0">Chủ nhật</option>
                </select>
              </label>
              <Field label="Giờ bắt đầu" name="start_time" defaultValue={schedule.start_time.slice(0, 5)} required type="time" />
              <Field label="Giờ kết thúc" name="end_time" defaultValue={schedule.end_time.slice(0, 5)} required type="time" />
              <Field label="Địa điểm" name="location" defaultValue={schedule.location || ""} />
              <Field label="Phòng" name="room_number" defaultValue={schedule.room_number || ""} />
              <Field label="Sức chứa" name="max_capacity" defaultValue={String(schedule.max_capacity || 20)} min={1} type="number" />
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-black">Mô tả</span>
                <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="description" defaultValue={schedule.description || ""} />
              </label>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setEditOpen(false)} type="button">Hủy</button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">Lưu lịch</button>
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
