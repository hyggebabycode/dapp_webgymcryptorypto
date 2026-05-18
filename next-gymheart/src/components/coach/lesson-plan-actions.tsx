"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { deleteLessonPlanAction, updateLessonPlanAction } from "@/lib/coach/actions";

type CourseOption = {
  id: string;
  course_name: string;
};

export type LessonPlanRecord = {
  id: string;
  course_id: string;
  week_number: number;
  lesson_title: string;
  objectives: string | null;
  warm_up: string | null;
  main_exercises: string | null;
  cool_down: string | null;
  equipment_needed: string[] | null;
  duration_minutes: number | null;
  difficulty_level: number | null;
  notes: string | null;
  video_url: string | null;
  is_published: boolean;
};

export function LessonPlanActions({
  className = "mt-3 flex gap-2",
  courses,
  lesson,
}: {
  className?: string;
  courses: CourseOption[];
  lesson: LessonPlanRecord;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className={className}>
      <button className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-50" onClick={() => setEditOpen(true)} type="button">
        Sửa
      </button>
      <form
        action={deleteLessonPlanAction}
        onSubmit={(event) => {
          if (!window.confirm(`Xóa tuần học ${lesson.lesson_title}?`)) event.preventDefault();
        }}
      >
        <input name="lesson_id" type="hidden" value={lesson.id} />
        <button className="rounded-lg border border-red-100 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50" type="submit">
          Xóa
        </button>
      </form>

      {editOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4">
          <form action={updateLessonPlanAction} className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Sửa tuần trong lộ trình</h2>
                <p className="mt-1 text-sm text-muted">Cập nhật mục tiêu, bài tập và trạng thái công khai.</p>
              </div>
              <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setEditOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-6">
              <input name="lesson_id" type="hidden" value={lesson.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black">Khóa học</span>
                  <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="course_id" required defaultValue={lesson.course_id}>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.course_name}</option>
                    ))}
                  </select>
                </label>
                <Field label="Tuần số" name="week_number" defaultValue={String(lesson.week_number)} min={1} type="number" />
                <Field className="md:col-span-2" label="Tên bài học" name="lesson_title" defaultValue={lesson.lesson_title} required />
                <TextArea className="md:col-span-2" label="Mục tiêu" name="objectives" defaultValue={lesson.objectives || ""} />
                <TextArea label="Khởi động" name="warm_up" defaultValue={lesson.warm_up || ""} />
                <TextArea label="Bài tập chính" name="main_exercises" defaultValue={lesson.main_exercises || ""} />
                <TextArea label="Thư giãn" name="cool_down" defaultValue={lesson.cool_down || ""} />
                <TextArea label="Thiết bị" name="equipment_needed" defaultValue={(lesson.equipment_needed || []).join("\n")} />
                <Field label="Thời lượng phút" name="duration_minutes" defaultValue={String(lesson.duration_minutes || 60)} min={1} type="number" />
                <Field label="Độ khó 1-5" name="difficulty_level" defaultValue={String(lesson.difficulty_level || 3)} max={5} min={1} type="number" />
                <TextArea className="md:col-span-2" label="Ghi chú" name="notes" defaultValue={lesson.notes || ""} />
                <Field className="md:col-span-2" label="Video hướng dẫn" name="video_url" defaultValue={lesson.video_url || ""} />
                <label className="flex items-center gap-2 text-sm font-black">
                  <input className="size-4 accent-primary" name="is_published" type="checkbox" defaultChecked={lesson.is_published} />
                  Công khai tuần học
                </label>
              </div>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setEditOpen(false)} type="button">Hủy</button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">Lưu tuần học</button>
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

function TextArea({
  className,
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-black">{label}</span>
      <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" {...props} />
    </label>
  );
}
