"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  addAdminScheduleAction,
  deleteScheduleAction,
  updateScheduleAction,
} from "@/lib/admin/actions";

export type ScheduleAdminRecord = {
  id: string;
  course_id: string;
  coach_id: string;
  title: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
  room_number: string | null;
  max_capacity: number | null;
};

type Option = {
  id: string;
  name: string;
};

type ScheduleFormProps = {
  courses: Option[];
  coaches: Option[];
  schedule?: ScheduleAdminRecord;
  action: (formData: FormData) => void;
  onCancel: () => void;
};

export function AddAdminScheduleButton({ courses, coaches }: { courses: Option[]; coaches: Option[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-white" onClick={() => setOpen(true)} type="button">
        Thêm lịch học
      </button>
      {open ? (
        <Modal title="Thêm lịch học" onClose={() => setOpen(false)}>
          <ScheduleForm action={addAdminScheduleAction} coaches={coaches} courses={courses} onCancel={() => setOpen(false)} />
        </Modal>
      ) : null}
    </>
  );
}

export function ScheduleRowActions({
  coaches,
  courses,
  schedule,
}: {
  courses: Option[];
  coaches: Option[];
  schedule: ScheduleAdminRecord;
}) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <button className="rounded-lg border border-blue-100 px-3 py-1 text-xs font-black text-blue-600 hover:bg-blue-50" onClick={() => setEditOpen(true)} type="button">
        Sửa
      </button>
      <form
        action={deleteScheduleAction}
        onSubmit={(event) => {
          if (!window.confirm(`Xóa lịch ${schedule.title}?`)) {
            event.preventDefault();
          }
        }}
      >
        <input name="schedule_id" type="hidden" value={schedule.id} />
        <button className="rounded-lg border border-red-100 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-50" type="submit">
          Xóa
        </button>
      </form>
      {editOpen ? (
        <Modal title="Sửa lịch học" onClose={() => setEditOpen(false)}>
          <ScheduleForm action={updateScheduleAction} coaches={coaches} courses={courses} schedule={schedule} onCancel={() => setEditOpen(false)} />
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
          <h2 className="text-2xl font-black">{title}</h2>
          <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={onClose} type="button">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ScheduleForm({ action, coaches, courses, onCancel, schedule }: ScheduleFormProps) {
  return (
    <form action={action}>
      <div className="grid gap-4 p-6 md:grid-cols-2">
        {schedule ? <input name="schedule_id" type="hidden" value={schedule.id} /> : null}
        <label>
          <span className="mb-2 block text-sm font-black">Khóa học</span>
          <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="course_id" required defaultValue={schedule?.course_id || ""}>
            <option value="">Chọn khóa học</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-sm font-black">Huấn luyện viên</span>
          <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="coach_id" required defaultValue={schedule?.coach_id || ""}>
            <option value="">Chọn HLV</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>{coach.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-sm font-black">Tên buổi học</span>
          <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="title" required defaultValue={schedule?.title || ""} />
        </label>
        <label>
          <span className="mb-2 block text-sm font-black">Thứ</span>
          <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="day_of_week" defaultValue={String(schedule?.day_of_week ?? 1)}>
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
          <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="start_time" required type="time" defaultValue={(schedule?.start_time || "").slice(0, 5)} />
        </label>
        <label>
          <span className="mb-2 block text-sm font-black">Giờ kết thúc</span>
          <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="end_time" required type="time" defaultValue={(schedule?.end_time || "").slice(0, 5)} />
        </label>
        <label>
          <span className="mb-2 block text-sm font-black">Địa điểm</span>
          <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="location" defaultValue={schedule?.location || ""} />
        </label>
        <label>
          <span className="mb-2 block text-sm font-black">Phòng</span>
          <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="room_number" defaultValue={schedule?.room_number || ""} />
        </label>
        <label>
          <span className="mb-2 block text-sm font-black">Sức chứa</span>
          <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" min="1" name="max_capacity" type="number" defaultValue={String(schedule?.max_capacity || 20)} />
        </label>
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-black">Mô tả</span>
          <textarea className="min-h-20 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="description" defaultValue={schedule?.description || ""} />
        </label>
      </div>
      <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
        <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={onCancel} type="button">Hủy</button>
        <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">Lưu lịch</button>
      </div>
    </form>
  );
}
