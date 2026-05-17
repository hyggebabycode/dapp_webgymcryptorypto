"use client";

import { useState } from "react";
import { Eye, FileText, X } from "lucide-react";
import {
  approvePtRequestAction,
  rejectPtRequestAction,
} from "@/lib/admin/actions";

export type PtRequestRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  bio: string | null;
  specialization: string | null;
  years_of_experience: number | null;
  certification: string | null;
  pt_request_note?: string | null;
  cvSignedUrl?: string | null;
  cvLabel?: string | null;
  teachingAvailability?: string | null;
};

export function PtRequestActions({ request }: { request: PtRequestRecord }) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <button
          className="inline-flex h-10 w-[104px] items-center justify-center gap-1 rounded-lg border border-blue-100 bg-blue-50 text-sm font-black text-blue-700 hover:bg-blue-100"
          onClick={() => setDetailOpen(true)}
          type="button"
        >
          <Eye size={15} />
          Chi tiết
        </button>
        <form action={approvePtRequestAction}>
          <input name="user_id" type="hidden" value={request.id} />
          <button className="h-10 w-[104px] rounded-lg bg-primary text-sm font-black text-white" type="submit">
            Duyệt
          </button>
        </form>
        <form action={rejectPtRequestAction}>
          <input name="user_id" type="hidden" value={request.id} />
          <button className="h-10 w-[104px] rounded-lg border border-pink-200 bg-white text-sm font-black text-primary hover:bg-primary-soft" type="submit">
            Từ chối
          </button>
        </form>
      </div>

      {detailOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4">
          <section className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">{request.full_name}</h2>
                <p className="mt-1 text-sm text-muted">{request.email}</p>
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

            <div className="max-h-[calc(92vh-154px)] overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Info label="Số điện thoại" value={request.phone || "Chưa cập nhật"} />
                <Info label="Khu vực / địa chỉ" value={request.address || "Chưa cập nhật"} />
                <Info label="Chuyên môn" value={request.specialization || "Chưa cập nhật"} />
                <Info label="Kinh nghiệm" value={`${request.years_of_experience ?? 0} năm`} />
                <Info className="md:col-span-2" label="Chứng chỉ" value={request.certification || "Chưa cập nhật"} />
                <Info className="md:col-span-2" label="Giới thiệu kinh nghiệm" value={request.bio || "Chưa cập nhật"} />

                <div className="rounded-xl bg-background p-4 md:col-span-2">
                  <p className="text-xs font-black uppercase text-muted">CV / file chứng nhận</p>
                  {request.cvSignedUrl ? (
                    <a
                      className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-white"
                      href={request.cvSignedUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <FileText size={16} />
                      Xem CV / chứng nhận
                    </a>
                  ) : request.cvLabel ? (
                    <p className="mt-2 text-sm font-bold text-muted">
                      Ứng viên có gửi file: {request.cvLabel}. Chưa tạo được link xem file.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm font-bold text-muted">
                      Chưa tìm thấy file CV/chứng nhận trong hệ thống.
                    </p>
                  )}
                </div>

                <Info
                  className="md:col-span-2"
                  label="Lịch có thể dạy"
                  value={request.teachingAvailability || "Ứng viên chưa nhập lịch có thể dạy."}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-pink-100 bg-primary-soft p-5">
              <form action={rejectPtRequestAction}>
                <input name="user_id" type="hidden" value={request.id} />
                <button className="h-10 rounded-lg border border-primary bg-white px-5 text-sm font-black text-primary" type="submit">
                  Từ chối
                </button>
              </form>
              <form action={approvePtRequestAction}>
                <input name="user_id" type="hidden" value={request.id} />
                <button className="h-10 rounded-lg bg-primary px-5 text-sm font-black text-white" type="submit">
                  Duyệt làm PT
                </button>
              </form>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function Info({
  className = "",
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`rounded-xl bg-background p-4 ${className}`}>
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-wrap font-bold leading-6">{value}</p>
    </div>
  );
}
