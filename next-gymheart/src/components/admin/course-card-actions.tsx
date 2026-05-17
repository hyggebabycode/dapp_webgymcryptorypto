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
};

type CoachOption = {
  id: string;
  full_name: string;
};

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
              <ListInfo label="Lợi ích" values={course.benefits || []} />
              <ListInfo label="Yêu cầu" values={course.requirements || []} />
            </div>
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <form action={updateCourseAction} className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
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
                  <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="coach_id" defaultValue={course.coach_id || ""}>
                    <option value="">Chưa gán HLV</option>
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>{coach.full_name}</option>
                    ))}
                  </select>
                </label>
                <Field label="Ngày bắt đầu" name="start_date" defaultValue={course.start_date || ""} type="date" />
                <Field label="Ngày kết thúc" name="end_date" defaultValue={course.end_date || ""} type="date" />
                <Field className="md:col-span-2" label="Ảnh khóa học" name="image_url" defaultValue={course.image_url || ""} />
                <Field className="md:col-span-2" label="Lịch học hiển thị" name="schedule_description" defaultValue={course.schedule_description || ""} />
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
                    placeholder={"Để trống nếu không đổi lộ trình hiện tại.\nMỗi dòng: Tiêu đề | Nội dung | Mục tiêu"}
                  />
                  <p className="mt-2 text-xs font-bold text-muted">Khi nhập nội dung ở đây, lộ trình cũ của khóa sẽ được thay bằng danh sách mới.</p>
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
