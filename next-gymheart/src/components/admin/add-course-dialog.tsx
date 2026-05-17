
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { addCourseAction } from "@/lib/admin/actions";

type CoachOption = {
  id: string;
  full_name: string;
};

export function AddCourseDialog({ coaches = [] }: { coaches?: CoachOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-white hover:opacity-90"
        onClick={() => setOpen(true)}
        type="button"
      >
        Thêm khóa học
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <form action={addCourseAction} className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Thêm khóa học</h2>
                <p className="mt-1 text-sm text-muted">Nhập đủ thông tin để khóa học hiển thị đẹp trên trang dịch vụ.</p>
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
            <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-6">
              <div className="mb-5 rounded-xl border border-pink-100 bg-primary-soft px-4 py-3 text-sm font-bold text-muted">
                Nên nhập đủ ảnh, lịch học, lợi ích, yêu cầu và lộ trình để học viên xem được thông tin trước khi thanh toán.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Tên khóa học</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="course_name" placeholder="VD: Boxing Fitness - Võ Thuật & Thể Hình" required />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Học phí (TEST)</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" min="0.0001" name="price" placeholder="3.5" required step="0.0001" type="number" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Thời lượng (tuần)</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" min="1" name="duration_weeks" placeholder="8" required type="number" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Sức chứa</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" min="1" name="max_students" type="number" defaultValue={20} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Cấp độ</span>
                  <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="level" defaultValue="all_levels">
                    <option value="beginner">Mới bắt đầu</option>
                    <option value="intermediate">Trung cấp</option>
                    <option value="advanced">Nâng cao</option>
                    <option value="all_levels">Mọi cấp độ</option>
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Huấn luyện viên</span>
                  <select className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="coach_id" defaultValue="">
                    <option value="">Chưa gán HLV</option>
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.full_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Ngày bắt đầu</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="start_date" type="date" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Ngày kết thúc</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="end_date" type="date" />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Ảnh khóa học</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="image_url" placeholder="https://images.unsplash.com/..." />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Lịch học hiển thị</span>
                  <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" name="schedule_description" placeholder="Thứ 2, 4, 6 - 06:00 - 07:30" />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Mô tả</span>
                  <textarea className="min-h-28 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="description" placeholder="Mô tả rõ mục tiêu, đối tượng phù hợp, phương pháp tập và kết quả kỳ vọng." />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Lợi ích</span>
                  <textarea className="min-h-32 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="benefits" placeholder={"Mỗi dòng một lợi ích\nGiảm mỡ và tăng sức bền\nTheo dõi chỉ số hằng tuần\nTư vấn dinh dưỡng cơ bản"} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black">Yêu cầu tham gia</span>
                  <textarea className="min-h-32 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="requirements" placeholder={"Mỗi dòng một yêu cầu\nKhông có chấn thương nặng\nMang giày tập và khăn\nCam kết tham gia tối thiểu 80% buổi"} />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black">Lộ trình học mẫu</span>
                  <textarea
                    className="min-h-36 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary"
                    name="lessons"
                    placeholder={"Mỗi dòng là một buổi. Có thể dùng: Tiêu đề | Nội dung | Mục tiêu\nBuổi 1: Đánh giá thể trạng | Đo chỉ số, test sức bền, hướng dẫn khởi động | Nắm kỹ thuật an toàn\nBuổi 2: Kỹ thuật nền tảng | Squat, push-up, plank đúng form | Xây nền thể lực"}
                  />
                  <p className="mt-2 text-xs font-bold text-muted">Dữ liệu này sẽ tạo lộ trình trong bảng course_lessons để nút “Xem lộ trình học” có nội dung ngay.</p>
                </label>
              </div>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setOpen(false)} type="button">
                Hủy
              </button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">
                Lưu khóa học
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
