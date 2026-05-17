"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { removeStudentEnrollmentAction } from "@/lib/coach/actions";

export type CoachStudentRecord = {
  enrollmentId: string;
  studentName: string;
  email: string;
  courseName: string;
  progress: number;
  notes: string | null;
};

export function StudentActions({ student }: { student: CoachStudentRecord }) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button className="h-10 rounded-lg border border-primary text-sm font-black text-primary hover:bg-primary hover:text-white" onClick={() => setDetailOpen(true)} type="button">
        Chi tiết
      </button>
      <form
        action={removeStudentEnrollmentAction}
        onSubmit={(event) => {
          if (!window.confirm(`Xóa ${student.studentName} khỏi lớp ${student.courseName}?`)) event.preventDefault();
        }}
      >
        <input name="enrollment_id" type="hidden" value={student.enrollmentId} />
        <button className="h-10 w-full rounded-lg bg-red-50 text-sm font-black text-red-600 hover:bg-red-100" type="submit">
          Xóa khỏi lớp
        </button>
      </form>

      {detailOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">{student.studentName}</h2>
                <p className="mt-1 text-sm text-muted">{student.email}</p>
              </div>
              <button aria-label="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setDetailOpen(false)} type="button">
                <X size={22} />
              </button>
            </div>
            <div className="space-y-4 p-6 text-sm">
              <Info label="Khóa học" value={student.courseName} />
              <Info label="Tiến độ" value={`${student.progress}%`} />
              <Info label="Ghi chú" value={student.notes || "Chưa có ghi chú"} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
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
