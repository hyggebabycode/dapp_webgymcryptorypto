"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { CoachScheduleActions, type CoachScheduleRecord } from "@/components/coach/schedule-actions";

type CourseOption = {
  id: string;
  course_name: string;
};

export type CoachWeeklyScheduleRecord = CoachScheduleRecord & {
  courseName: string;
};

const dayLabels = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const offset = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - offset);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
}

function weekRangeLabel(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
}

function scheduleSearchText(schedule: CoachWeeklyScheduleRecord) {
  return normalize(
    [
      schedule.title,
      schedule.description || "",
      schedule.courseName,
      schedule.location || "",
      schedule.room_number || "",
      dayLabels[schedule.day_of_week] || "",
      schedule.start_time,
      schedule.end_time,
    ].join(" "),
  );
}

export function CoachWeeklySchedule({
  courses,
  initialDate,
  schedules,
}: {
  courses: CourseOption[];
  initialDate: string;
  schedules: CoachWeeklyScheduleRecord[];
}) {
  const baseWeekStart = useMemo(() => startOfWeek(new Date(initialDate)), [initialDate]);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => addDays(baseWeekStart, weekOffset * 7), [baseWeekStart, weekOffset]);
  const normalizedQuery = normalize(query.trim());

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const matchesQuery = !normalizedQuery || scheduleSearchText(schedule).includes(normalizedQuery);
      const matchesCourse = !courseId || schedule.course_id === courseId;
      return matchesQuery && matchesCourse;
    });
  }, [courseId, normalizedQuery, schedules]);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);
        return {
          date,
          schedules: filteredSchedules
            .filter((schedule) => Number(schedule.day_of_week) === date.getDay())
            .sort((left, right) => String(left.start_time).localeCompare(String(right.start_time))),
        };
      }),
    [filteredSchedules, weekStart],
  );

  const hasFilter = Boolean(query.trim() || draftQuery.trim() || courseId);
  const weekTitle = weekOffset === 0 ? "Tuần hiện tại" : weekOffset > 0 ? `Sau ${weekOffset} tuần` : `Trước ${Math.abs(weekOffset)} tuần`;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <form
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(draftQuery);
            }}
          >
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" size={18} />
              <input
                className="h-11 w-full rounded-lg border border-pink-100 bg-white pl-11 pr-4 text-sm outline-none focus:border-primary"
                onChange={(event) => setDraftQuery(event.target.value)}
                placeholder="Tìm khóa học, phòng, vị trí..."
                type="search"
                value={draftQuery}
              />
            </label>
            <button className="h-11 rounded-lg bg-primary px-5 text-sm font-black text-white hover:bg-[#d91f4c]" type="submit">
              Tìm kiếm
            </button>
          </form>

          <div className="flex flex-wrap gap-2 border-t border-pink-100 pt-3">
            <button
              className={`h-10 rounded-lg border px-3 text-sm font-black ${
                courseId === "" ? "border-primary bg-primary text-white" : "border-pink-100 bg-white text-muted hover:text-primary"
              }`}
              onClick={() => setCourseId("")}
              type="button"
            >
              Tất cả khóa
            </button>
            {courses.map((course) => (
              <button
                className={`h-10 rounded-lg border px-3 text-sm font-black ${
                  courseId === course.id ? "border-primary bg-primary text-white" : "border-pink-100 bg-white text-muted hover:text-primary"
                }`}
                key={course.id}
                onClick={() => setCourseId(course.id)}
                type="button"
              >
                {course.course_name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-muted">
          <span>{filteredSchedules.length} lịch phù hợp</span>
          {hasFilter ? (
            <button className="text-primary hover:underline" onClick={() => { setDraftQuery(""); setQuery(""); setCourseId(""); }} type="button">
              Xóa bộ lọc
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-black">{weekTitle}</h2>
            <p className="mt-1 text-sm font-bold text-muted">{weekRangeLabel(weekStart)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-pink-100 px-3 text-sm font-black text-muted hover:text-primary"
              onClick={() => setWeekOffset((value) => value - 1)}
              type="button"
            >
              <ChevronLeft size={16} /> Tuần trước
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary px-3 text-sm font-black text-primary hover:bg-primary hover:text-white"
              onClick={() => setWeekOffset(0)}
              type="button"
            >
              <RotateCcw size={16} /> Hôm nay
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-pink-100 px-3 text-sm font-black text-muted hover:text-primary"
              onClick={() => setWeekOffset((value) => value + 1)}
              type="button"
            >
              Tuần sau <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-7">
          {days.map(({ date, schedules: daySchedules }) => (
            <div className="min-h-48 rounded-xl border border-pink-100 bg-background p-3" key={date.toISOString()}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-black">{dayLabels[date.getDay()]}</p>
                  <p className="text-xs font-bold text-muted">{formatDate(date)}</p>
                </div>
                {daySchedules.length > 0 ? (
                  <span className="rounded-full bg-primary-soft px-2 py-1 text-xs font-black text-primary">{daySchedules.length}</span>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {daySchedules.length > 0 ? (
                  daySchedules.map((schedule) => (
                    <article className="rounded-lg bg-white p-3 shadow-sm" key={schedule.id}>
                      <p className="text-sm font-black">{schedule.courseName}</p>
                      <p className="mt-1 text-xs font-bold text-primary">
                        {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {schedule.location || "Phòng tập"} {schedule.room_number ? `· ${schedule.room_number}` : ""}
                      </p>
                      <CoachScheduleActions className="mt-3 flex gap-2" courses={courses} schedule={schedule} />
                    </article>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-pink-100 bg-white px-3 py-4 text-center text-xs font-bold text-muted">
                    Không có lịch
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
