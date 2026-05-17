"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  deleteCourseAction,
  toggleCourseStatusAction,
  updateCourseAction,
} from "@/lib/admin/actions";
import { baseAmountToTest, formatBaseAsTest } from "@/lib/currency";

export type CourseAdminRecord = {
  id: string;
  course_name: string;
  description: string | null;
  price: number;
  duration_weeks: number;
  level: string;
  current_students: number;
  max_students: number;
  image_url: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  schedule_description: string | null;
  benefits: string[] | null;
  requirements: string[] | null;
  coach_id: string | null;
  course_lessons:
    | {
        id: string;
        lesson_order: number;
        title: string;
        content: string | null;
        objectives: string | null;
      }[]
    | null;
  schedules:
    | {
        id: string;
        title: string;
        description: string | null;
        day_of_week: number;
        start_time: string;
        end_time: string;
        location: string | null;
        room_number: string | null;
        max_capacity: number | null;
        is_cancelled?: boolean | null;
      }[]
    | null;
};

type CoachOption = {
  id: string;
  full_name: string;
};

const dayLabels: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ hai",
  2: "Thứ ba",
  3: "Thứ tư",
  4: "Thứ năm",
  5: "Thứ sáu",
  6: "Thứ bảy",
};

function serializeLessons(course: CourseAdminRecord) {
  return (course.course_lessons || [])
    .slice()
    .sort((left, right) => Number(left.lesson_order || 0) - Number(right.lesson_order || 0))
    .map((lesson) => [lesson.title, lesson.content || "", lesson.objectives || ""].join(" | "))
    .join("\n");
}

function serializeSchedules(course: CourseAdminRecord) {
  return (course.schedules || [])
    .filter((schedule) => !schedule.is_cancelled)
    .slice()
    .sort((left, right) => {
      const dayCompare = Number(left.day_of_week || 0) - Number(right.day_of_week || 0);
      if (dayCompare !== 0) return dayCompare;
      return String(left.start_time).localeCompare(String(right.start_time));
    })
    .map((schedule) =>
      [
        dayLabels[schedule.day_of_week] || schedule.day_of_week,
        String(schedule.start_time || "").slice(0, 5),
        String(schedule.end_time || "").slice(0, 5),
        schedule.location || "",
        schedule.room_number || "",
        schedule.description || "",
      ].join(" | "),
    )
    .join("\n");
}

export function CourseCardActions({ course, coaches }: { course: CourseAdminRecord; coaches: CoachOption[] }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:w-[236px]">
      <button className="h-9 w-[112px] rounded-lg border border-primary text-xs font-black text-primary hover:bg-primary hover:text-white" onClick={() => setDetailOpen(true)} type="button">
        Chi tiết
      </button>
      <button className="h-9 w-[112px] rounded-lg border border-blue-100 text-xs font-black text-blue-600 hover:bg-blue-50" onClick={() => setEditOpen(true)} type="button">
        Sửa
      </button>
      <form action={toggleCourseStatusAction}>
        <input name="course_id" type="hidden" value={course.id} />
        <input name="next_active" type="hidden" value={String(!course.is_active)} />
        <button className="h-9 w-[112px] rounded-lg border border-orange-100 text-xs font-black text-orange-600 hover:bg-orange-50" type="submit">
          {course.is_active ? "Ẩn" : "Mở lại"}
        </button>
      </form>
      <form
        action={deleteCourseAction}
        onSubmit={(event) => {
          if (!window.confirm(`Lưu trữ khóa học ${course.course_name}? Khóa sẽ được ẩn khỏi danh sách đăng ký mới.`)) {
            event.preventDefault();
          }
        }}
      >
        <input name="course_id" type="hidden" value={course.id} />
        <button className="h-9 w-[112px] rounded-lg border border-red-100 text-xs font-black text-red-600 hover:bg-red-50" type="submit">
          Lưu trữ
        </button>
      </form>

      {detailOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">{course.course_name}</h2>
                <p className="mt-1 text-sm text-muted">{formatBaseAsTest(course.price)} · {course.duration_weeks} tuần</p>
              </div>
              <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setDetailOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="space-y-4 p-6 text-sm">
              <p className="text-muted">{course.description || "Chưa có mô tả."}</p>
              <Info label="Lịch học" value={course.schedule_description || "Chưa cập nhật"} />
              <Info label="Thời gian" value={`${course.start_date || "?"} - ${course.end_date || "?"}`} />
              <ListInfo
                label="Khung giờ học"
                values={(course.schedules || [])
                  .filter((schedule) => !schedule.is_cancelled)
                  .map((schedule) => `${dayLabels[schedule.day_of_week] || schedule.day_of_week}: ${String(schedule.start_time).slice(0, 5)} - ${String(schedule.end_time).slice(0, 5)}${schedule.location ? ` · ${schedule.location}` : ""}${schedule.room_number ? ` · ${schedule.room_number}` : ""}`)}
              />
              <ListInfo label="Lợi ích" values={course.benefits || []} />
              <ListInfo label="Yêu cầu" values={course.requirements || []} />
            </div>
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <form action={updateCourseAction} className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl" encType="multipart/form-data">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Sửa khóa học</h2>
                <p className="mt-1 text-sm text-muted">Cập nhật nội dung hiển thị và thông tin quản lý khóa học.</p>
              </div>
              <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setEditOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-6">
              <input name="course_id" type="hidden" value={course.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field className="md:col-span-2" label="Tên khóa học" name="course_name" defaultValue={course.course_name} required />
                <Field label="Học phí (TEST)" name="price" defaultValue={String(baseAmountToTest(course.price))} min={0.0001} required step={0.0001} type="number" />
                <Field label="Thời lượng (tuần)" name="duration_weeks" defaultValue={String(course.duration_weeks)} min={1} required type="number" />
                <Field label="Sức chứa" name="max_students" defaultValue={String(course.max_students)} min={1} type="number" />
                <label>
                  <span className="mb-2 block text-sm font-black">Cấp độ</span>
                  <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="level" defaultValue={course.level}>
                    <option value="beginner">Mới bắt đầu</option>
                    <option value="intermediate">Trung cấp</option>
                    <option value="advanced">Nâng cao</option>
                    <option value="all_levels">Mọi cấp độ</option>
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Huấn luyện viên</span>
                  <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="coach_id" defaultValue={course.coach_id || ""} required>
                    <option value="" disabled>Chọn HLV đứng lớp</option>
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>{coach.full_name}</option>
                    ))}
                  </select>
                </label>
                <Field label="Ngày bắt đầu" name="start_date" defaultValue={course.start_date || ""} type="date" />
                <Field label="Ngày kết thúc" name="end_date" defaultValue={course.end_date || ""} type="date" />
                <Field className="md:col-span-2" label="Ảnh khóa học" name="image_url" defaultValue={course.image_url || ""} />
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Chọn ảnh mới từ máy</span>
                  <input className="w-full rounded-lg border border-pink-100 bg-white px-4 py-2 text-sm outline-none focus:border-primary" name="image_file" accept="image/*" type="file" />
                </label>
                <Field className="md:col-span-2" label="Lịch học hiển thị" name="schedule_description" defaultValue={course.schedule_description || ""} />
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Khung giờ học</span>
                  <textarea
                    className="min-h-32 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary"
                    name="schedules"
                    defaultValue={serializeSchedules(course)}
                    placeholder={"Mỗi dòng: Thứ | Giờ bắt đầu | Giờ kết thúc | Địa điểm | Phòng | Ghi chú\nThứ hai | 17:00 | 18:30 | Khu B | Phòng CrossFit | Training chuyên sâu"}
                  />
                  <p className="mt-2 text-xs font-bold text-muted">Các dòng này sẽ tạo lịch cụ thể theo từng ngày trong khoảng ngày bắt đầu và kết thúc của khóa.</p>
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Mô tả</span>
                  <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="description" defaultValue={course.description || ""} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Lợi ích</span>
                  <textarea className="min-h-28 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="benefits" defaultValue={(course.benefits || []).join("\n")} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Yêu cầu</span>
                  <textarea className="min-h-28 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="requirements" defaultValue={(course.requirements || []).join("\n")} />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Cập nhật lộ trình học</span>
                  <textarea
                    className="min-h-32 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary"
                    name="lessons"
                    defaultValue={serializeLessons(course)}
                    placeholder={"Mỗi dòng: Tiêu đề | Nội dung | Mục tiêu"}
                  />
                  <p className="mt-2 text-xs font-bold text-muted">Danh sách này sẽ thay thế lộ trình hiện tại của khóa.</p>
                </label>
              </div>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setEditOpen(false)} type="button">Hủy</button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">Lưu thay đổi</button>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background p-4">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function ListInfo({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-xl bg-background p-4">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      {values.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {values.map((value) => <li key={value}>{value}</li>)}
        </ul>
      ) : (
        <p className="mt-1 font-bold">Chưa cập nhật</p>
      )}
    </div>
  );
}
