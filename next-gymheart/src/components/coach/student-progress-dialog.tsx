"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updateStudentProgressAction } from "@/lib/coach/actions";

type Props = {
  enrollmentId: string;
  studentName: string;
  defaultProgress: number;
};

export function StudentProgressDialog({ enrollmentId, studentName, defaultProgress }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="mt-4 h-10 w-full rounded-lg border border-primary text-sm font-black text-primary hover:bg-primary hover:text-white" onClick={() => setOpen(true)} type="button">
        Cập nhật tiến độ
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <form action={updateStudentProgressAction} className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Cập nhật học viên</h2>
                <p className="mt-1 text-sm text-muted">{studentName}</p>
              </div>
              <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <input name="enrollment_id" type="hidden" value={enrollmentId} />
              <label className="block">
                <span className="mb-2 block text-sm font-black">Tiến độ hoàn thành (%)</span>
                <input className="h-11 w-full rounded-lg border border-pink-100 px-4 outline-none focus:border-primary" max="100" min="0" name="progress_percentage" type="number" defaultValue={defaultProgress} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black">Ghi chú</span>
                <textarea className="min-h-24 w-full rounded-lg border border-pink-100 px-4 py-3 outline-none focus:border-primary" name="notes" />
              </label>
            </div>
            <div className="flex gap-3 border-t border-pink-100 bg-primary-soft p-6">
              <button className="h-11 flex-1 rounded-lg border border-primary bg-white font-black text-primary" onClick={() => setOpen(false)} type="button">Hủy</button>
              <button className="h-11 flex-1 rounded-lg bg-primary font-black text-white" type="submit">Lưu tiến độ</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
