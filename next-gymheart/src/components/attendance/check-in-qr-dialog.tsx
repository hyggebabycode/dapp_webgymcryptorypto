"use client";

import { useState } from "react";
import { QrCode, X } from "lucide-react";

export function CheckInQrDialog({
  courseName,
  qrDataUrl,
}: {
  courseName: string;
  qrDataUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary px-4 text-sm font-black text-primary hover:bg-primary-soft"
        onClick={() => setOpen(true)}
        type="button"
      >
        <QrCode size={16} />
        Check-in
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4">
          <button
            aria-label="Đóng mã check-in"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-muted">Mã vào lớp</p>
                <h2 className="mt-1 text-xl font-black">{courseName}</h2>
              </div>
              <button
                aria-label="Đóng"
                className="inline-flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary hover:bg-[#ffe1e9]"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-pink-100 bg-white p-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- QR data URLs are generated server-side and do not need optimization. */}
              <img
                alt={`Mã QR check-in ${courseName}`}
                className="mx-auto size-64"
                src={qrDataUrl}
              />
            </div>

            <p className="mt-4 rounded-lg bg-primary-soft px-4 py-3 text-sm font-bold text-primary">
              Đưa mã này cho lễ tân hoặc HLV quét khi bạn đến phòng tập.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}
