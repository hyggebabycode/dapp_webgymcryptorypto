"use client";

import { useState, useTransition } from "react";
import { BookOpen, CalendarDays, CheckCircle2, Clock, Map, MapPin, X } from "lucide-react";
import {
  getCourseRoadmapAction,
  getCourseScheduleAction,
  type CourseLesson,
  type CourseSchedule,
} from "@/lib/courses/actions";

const dayNames: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ hai",
  2: "Thứ ba",
  3: "Thứ tư",
  4: "Thứ năm",
  5: "Thứ sáu",
  6: "Thứ bảy",
};

function scheduleDayLabel(schedule: CourseSchedule) {
  return schedule.occurrence_label || dayNames[schedule.day_of_week] || "Lịch học";
}

export function CourseRoadmapDialog({
  courseId,
  courseName,
  buttonClassName,
  label = "Xem lộ trình học",
}: {
  courseId: string;
  courseName: string;
  buttonClassName?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"roadmap" | "schedule">("roadmap");
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function openDialog() {
    setOpen(true);
    setActiveTab("roadmap");

    if (!loaded) {
      startTransition(async () => {
        const [roadmapData, scheduleData] = await Promise.all([
          getCourseRoadmapAction(courseId),
          getCourseScheduleAction(courseId),
        ]);
        setLessons(roadmapData);
        setSchedules(scheduleData);
        setLoaded(true);
      });
    }
  }

  return (
    <>
      <button
        className={
          buttonClassName ||
          "mb-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-primary px-4 text-sm font-black text-primary hover:bg-primary-soft"
        }
        onClick={openDialog}
        type="button"
      >
        <Map size={15} />
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <h2 className="text-2xl font-black">{courseName}</h2>
              <button
                aria-label="Đóng"
                className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex border-b border-pink-100 px-6">
              <button
                className={`border-b-2 px-6 py-3 text-sm font-black ${
                  activeTab === "roadmap"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-primary"
                }`}
                onClick={() => setActiveTab("roadmap")}
                type="button"
              >
                Lộ trình học
              </button>
              <button
                className={`border-b-2 px-6 py-3 text-sm font-black ${
                  activeTab === "schedule"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-primary"
                }`}
                onClick={() => setActiveTab("schedule")}
                type="button"
              >
                Lịch tập
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {isPending ? (
                <div className="py-16 text-center text-sm font-bold text-muted">
                  Đang tải thông tin khóa học...
                </div>
              ) : activeTab === "roadmap" ? (
                lessons.length > 0 ? (
                  <div className="space-y-4">
                    {lessons.map((lesson) => (
                      <article className="rounded-[1.5rem] border border-pink-100 bg-background p-5" key={lesson.id}>
                        <div className="flex gap-5">
                          <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-black text-white">
                            {lesson.lesson_order}
                          </div>
                          <div>
                            <h3 className="text-lg font-black">{lesson.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-muted">{lesson.content}</p>
                            {lesson.objectives ? (
                              <p className="mt-3 flex items-start gap-2 text-sm font-bold text-muted">
                                <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={16} />
                                <span>
                                  <strong>Mục tiêu:</strong> {lesson.objectives}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-muted">
                    <BookOpen className="mx-auto mb-4 text-primary" size={44} />
                    Chưa có lộ trình học cho khóa học này.
                  </div>
                )
              ) : schedules.length > 0 ? (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <article className="rounded-[1.5rem] border border-pink-100 bg-background p-5" key={schedule.id}>
                      <div className="flex gap-5">
                        <div className="flex min-h-16 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-primary bg-primary-soft px-2 text-center text-xs font-black leading-5 text-primary">
                          {scheduleDayLabel(schedule)}
                        </div>
                        <div>
                          <h3 className="text-lg font-black">{schedule.title}</h3>
                          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-muted">
                            <Clock size={16} className="text-primary" />
                            {schedule.start_time} - {schedule.end_time}
                          </p>
                          {schedule.occurrence_date ? (
                            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-muted">
                              <CalendarDays size={16} className="text-primary" />
                              {schedule.occurrence_label}
                            </p>
                          ) : null}
                          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                            <MapPin size={16} className="text-primary" />
                            {schedule.location || "Phòng tập"}
                            {schedule.room_number ? `, ${schedule.room_number}` : ""}
                          </p>
                          {schedule.description ? <p className="mt-3 text-sm leading-6 text-muted">{schedule.description}</p> : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-muted">
                  <CalendarDays className="mx-auto mb-4 text-primary" size={44} />
                  Chưa có lịch tập cho khóa học này.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
