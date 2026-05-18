"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { LessonPlanActions, type LessonPlanRecord } from "@/components/coach/lesson-plan-actions";
import { CoachScheduleActions, type CoachScheduleRecord } from "@/components/coach/schedule-actions";
import { deleteCourseLessonAction, updateCourseLessonAction } from "@/lib/coach/actions";

type CourseOption = {
  id: string;
  course_name: string;
};

export type CoachRoadmapItem = {
  id: string;
  order: number;
  title: string;
  summary: string;
  meta: string;
  details: { label: string; value: string }[];
  courseLesson: CourseLessonRecord | null;
  lessonPlan: LessonPlanRecord | null;
};

type CourseLessonRecord = {
  id: string;
  course_id: string;
  lesson_order: number;
  title: string;
  content: string | null;
  objectives: string | null;
};

const dayNames: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ hai",
  2: "Thứ ba",
  3: "Thứ tư",
  4: "Thứ năm",
  5: "Thứ sáu",
  6: "Thứ bảy",
};

export function CoachRoadmapPreview({
  courses,
  items,
  schedules,
}: {
  courses: CourseOption[];
  items: CoachRoadmapItem[];
  schedules: CoachScheduleRecord[];
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const previewItems = items.slice(0, 2);

  if (items.length === 0) {
    return <p className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-muted">Chưa có lộ trình dạy cho khóa học này.</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {previewItems.map((item) => (
          <RoadmapItemCard courses={courses} item={item} key={item.id} schedules={schedules} />
        ))}
      </div>

      <button
        className="mt-3 h-10 w-full rounded-lg border border-primary bg-white text-sm font-black text-primary hover:bg-primary hover:text-white"
        onClick={() => setDetailOpen(true)}
        type="button"
      >
        Xem chi tiết lộ trình
      </button>

      {detailOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Chi tiết lộ trình dạy</h2>
                <p className="mt-1 text-sm text-muted">{items.length} tuần trong lộ trình</p>
              </div>
              <button
                aria-label="Đóng"
                className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                onClick={() => setDetailOpen(false)}
                type="button"
              >
                <X size={22} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-96px)] space-y-3 overflow-y-auto p-6">
              {items.map((item) => (
                <RoadmapItemCard courses={courses} item={item} key={item.id} schedules={schedules} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function RoadmapItemCard({
  courses,
  item,
  schedules,
}: {
  courses: CourseOption[];
  item: CoachRoadmapItem;
  schedules: CoachScheduleRecord[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-white p-4">
      <div>
        <p className="font-black">Tuần {item.order}: {item.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{item.summary}</p>
        <p className="mt-2 text-xs font-bold text-muted">{item.meta}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-lg border border-primary px-3 py-2 text-xs font-black text-primary hover:bg-primary hover:text-white"
          onClick={() => setOpen(true)}
          type="button"
        >
          Xem chi tiết
        </button>
        {item.lessonPlan ? <LessonPlanActions className="flex gap-2" courses={courses} lesson={item.lessonPlan} /> : null}
        {item.courseLesson ? <CourseLessonActions className="flex gap-2" lesson={item.courseLesson} /> : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Tuần {item.order}: {item.title}</h2>
                <p className="mt-1 text-sm font-bold text-muted">{item.meta}</p>
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
            <div className="max-h-[calc(92vh-96px)] space-y-4 overflow-y-auto p-6 text-sm">
              <section className="rounded-xl bg-background p-4">
                <p className="text-xs font-black uppercase text-muted">Lịch học tuần {item.order}</p>
                {schedules.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {schedules.map((schedule) => (
                      <div className="rounded-lg bg-white p-4" key={schedule.id}>
                        <p className="font-black">{schedule.title}</p>
                        <p className="mt-1 text-sm font-bold text-muted">
                          {dayNames[schedule.day_of_week] || "Trong tuần"} · {schedule.start_time.slice(0, 5)}-{schedule.end_time.slice(0, 5)}
                          {schedule.location ? ` · ${schedule.location}` : ""}
                          {schedule.room_number ? ` · ${schedule.room_number}` : ""}
                        </p>
                        {schedule.description ? <p className="mt-2 text-sm text-muted">{schedule.description}</p> : null}
                        <CoachScheduleActions courses={courses} schedule={schedule} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 font-bold text-muted">Chưa có lịch học cho khóa này.</p>
                )}
              </section>
              <Info label="Mô tả" value={item.summary} />
              {item.details.map((detail) => (
                <Info key={detail.label} label={detail.label} value={detail.value} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CourseLessonActions({ className, lesson }: { className: string; lesson: CourseLessonRecord }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className={className}>
      <button className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-50" onClick={() => setEditOpen(true)} type="button">
        Sửa
      </button>
      <form
        action={deleteCourseLessonAction}
        onSubmit={(event) => {
          if (!window.confirm(`Xóa tuần học ${lesson.title}?`)) event.preventDefault();
        }}
      >
        <input name="course_lesson_id" type="hidden" value={lesson.id} />
        <input name="course_id" type="hidden" value={lesson.course_id} />
        <button className="rounded-lg border border-red-100 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50" type="submit">
          Xóa
        </button>
      </form>

      {editOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4">
          <form action={updateCourseLessonAction} className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Sửa lộ trình học</h2>
                <p className="mt-1 text-sm text-muted">Cập nhật tuần, tiêu đề và nội dung hiển thị cho học viên.</p>
              </div>
              <button
                aria-label="Đóng"
                className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                onClick={() => setEditOpen(false)}
                type="button"
              >
                <X size={22} />
              </button>
            </div>
            <div className="grid gap-4 p-6">
              <input name="course_lesson_id" type="hidden" value={lesson.id} />
              <input name="course_id" type="hidden" value={lesson.course_id} />
              <label>
                <span className="mb-2 block text-sm font-black">Tuần số</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" min="1" name="lesson_order" type="number" defaultValue={String(lesson.lesson_order)} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Tên bài học</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="title" required defaultValue={lesson.title} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Mục tiêu</span>
                <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="objectives" defaultValue={lesson.objectives || ""} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-black">Nội dung</span>
                <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="content" required defaultValue={lesson.content || ""} />
              </label>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setEditOpen(false)} type="button">Hủy</button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">Lưu lộ trình</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background p-4">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-line font-bold leading-6">{value}</p>
    </div>
  );
}
