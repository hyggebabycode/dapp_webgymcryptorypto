"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { addLessonPlanAction } from "@/lib/coach/actions";

type CourseOption = {
  id: string;
  course_name: string;
};

export function AddLessonPlanDialog({ courses }: { courses: CourseOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-white" onClick={() => setOpen(true)} type="button">
        Thêm tuần học
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <form action={addLessonPlanAction} className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Thêm tuần vào lộ trình</h2>
                <p className="mt-1 text-sm text-muted">Ghi chi tiết mục tiêu, bài tập và thiết bị cho từng tuần học.</p>
              </div>
              <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black">Khóa học</span>
                  <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="course_id" required>
                    <option value="">Chọn khóa học</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.course_name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Tuần số</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" min="1" name="week_number" type="number" defaultValue={1} />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Tên bài học</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="lesson_title" required />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Mục tiêu</span>
                  <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="objectives" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Khởi động</span>
                  <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="warm_up" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Bài tập chính</span>
                  <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="main_exercises" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Thư giãn</span>
                  <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="cool_down" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Thiết bị</span>
                  <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="equipment_needed" placeholder="Mỗi dòng một thiết bị" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Thời lượng phút</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" min="1" name="duration_minutes" type="number" defaultValue={60} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Độ khó 1-5</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" max="5" min="1" name="difficulty_level" type="number" defaultValue={3} />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Ghi chú</span>
                  <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="notes" />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Video hướng dẫn</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="video_url" placeholder="https://..." />
                </label>
                <label className="flex items-center gap-2 text-sm font-black">
                  <input className="size-4 accent-primary" name="is_published" type="checkbox" />
                  Công khai tuần học
                </label>
              </div>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setOpen(false)} type="button">Hủy</button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">Lưu tuần học</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
