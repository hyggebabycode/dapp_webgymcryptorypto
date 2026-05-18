"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Dumbbell,
  Users,
  X,
} from "lucide-react";
import {
  AddToCartButton,
  type CartItem,
} from "@/components/cart/add-to-cart-button";
import { formatBaseAsTest } from "@/lib/currency";
import type { Course } from "@/lib/data/courses";

const fallbackImage =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000";

const levelLabels: Record<string, string> = {
  beginner: "Mới bắt đầu",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
  all_levels: "Mọi cấp độ",
};

function formatDate(value: string | null) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function DetailList({ items }: { items: string[] | null }) {
  if (!items || items.length === 0) {
    return <p className="text-sm font-bold text-muted">Chưa cập nhật.</p>;
  }

  return (
    <ul className="space-y-2 text-sm font-bold leading-6 text-[#4e333a]">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={16} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CourseDetailDialog({
  cartItem,
  course,
  isAuthenticated,
  isEnrolled,
}: {
  cartItem: CartItem;
  course: Course;
  isAuthenticated: boolean;
  isEnrolled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const coachName = course.coach?.full_name || "Chưa gán HLV";
  const coachAvatar =
    course.coach?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(coachName)}&background=f42559&color=fff&size=160`;
  const coachDetails = course.coach
    ? [
        course.coach.specialization
          ? `Chuyên môn: ${course.coach.specialization}`
          : null,
        course.coach.years_of_experience != null
          ? `Kinh nghiệm: ${course.coach.years_of_experience} năm`
          : "Kinh nghiệm: Chưa cập nhật",
        course.coach.certification
          ? `Chứng chỉ: ${course.coach.certification}`
          : "Chứng chỉ: Chưa cập nhật",
      ]
    : [];
  const coachPopupDetails = course.coach
    ? [
        course.coach.specialization
          ? `Chuyên môn: ${course.coach.specialization}`
          : "Chuyên môn: Chưa cập nhật",
        course.coach.years_of_experience != null
          ? `Kinh nghiệm: ${course.coach.years_of_experience} năm`
          : "Kinh nghiệm: Chưa cập nhật",
        course.coach.certification
          ? `Chứng chỉ: ${course.coach.certification}`
          : "Chứng chỉ: Chưa cập nhật",
      ]
    : [];

  function closeDialog() {
    setCoachOpen(false);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (coachOpen) {
        setCoachOpen(false);
        return;
      }
      closeDialog();
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, coachOpen]);

  return (
    <>
      <button
        aria-label={`Xem chi tiết khóa học ${course.course_name}`}
        className="group relative block h-44 w-full overflow-hidden bg-cover bg-center text-left"
        onClick={() => setOpen(true)}
        style={{
          backgroundImage: `url(${course.image_url || fallbackImage})`,
        }}
        type="button"
      >
        <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-primary opacity-0 shadow-sm transition group-hover:opacity-100">
          Xem chi tiết
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
          <button
            aria-label="Đóng chi tiết khóa học"
            className="absolute inset-0"
            onClick={closeDialog}
            type="button"
          />
          <section className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="grid max-h-[92vh] overflow-y-auto lg:grid-cols-[1fr_390px]">
              <div>
                <div
                  className="h-64 bg-cover bg-center sm:h-80"
                  style={{
                    backgroundImage: `url(${course.image_url || fallbackImage})`,
                  }}
                />
                <div className="space-y-6 p-6">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-black text-primary">
                        {levelLabels[course.level] || course.level}
                      </span>
                      {isEnrolled ? (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                          Đã đăng ký
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">
                      {course.course_name}
                    </h2>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
                      {course.description ||
                        "Khóa học đang được cập nhật mô tả chi tiết."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-primary-soft p-4">
                      <p className="text-xs font-black uppercase text-muted">
                        Lịch học
                      </p>
                      <p className="mt-2 font-black">
                        {course.schedule_description ||
                          "Chưa cập nhật lịch học"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary-soft p-4">
                      <p className="text-xs font-black uppercase text-muted">
                        Thời gian
                      </p>
                      <p className="mt-2 font-black">
                        {formatDate(course.start_date)} -{" "}
                        {formatDate(course.end_date)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-lg font-black">
                        Lợi ích khóa học
                      </h3>
                      <DetailList items={course.benefits} />
                    </div>
                    <div>
                      <h3 className="mb-3 text-lg font-black">
                        Yêu cầu tham gia
                      </h3>
                      <DetailList items={course.requirements} />
                    </div>
                  </div>
                </div>
              </div>

              <aside className="border-t border-border-soft bg-[#fff7f9] p-6 lg:border-l lg:border-t-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase text-muted">
                      Chi tiết khóa học
                    </p>
                    <p className="mt-2 text-3xl font-black text-primary">
                      {formatBaseAsTest(course.price)}
                    </p>
                  </div>
                  <button
                    aria-label="Đóng"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-white text-muted hover:bg-primary-soft hover:text-primary"
                    onClick={closeDialog}
                    type="button"
                  >
                    <X size={22} />
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 rounded-xl bg-white p-4">
                    <div
                      aria-label={`Avatar của ${coachName}`}
                      className="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-black text-primary"
                      style={{
                        backgroundImage: `url(${coachAvatar})`,
                        backgroundSize: "cover",
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase text-muted">
                            HLV đứng lớp
                          </p>
                          <p className="font-black">{coachName}</p>
                        </div>
                        {course.coach ? (
                          <button
                            className="inline-flex h-8 items-center justify-center rounded-full border border-primary px-3 text-xs font-black text-primary hover:bg-primary-soft"
                            onClick={() => setCoachOpen(true)}
                            type="button"
                          >
                            Chi tiết HLV
                          </button>
                        ) : null}
                      </div>
                      {course.coach ? (
                        <div className="mt-2 space-y-1 text-sm font-bold text-muted">
                          {coachDetails.map((detail, index) =>
                            detail ? (
                              <p key={`${course.id}-coach-${index}`}>
                                {detail}
                              </p>
                            ) : null,
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-4">
                      <Clock className="mb-2 text-primary" size={20} />
                      <p className="text-xs font-black uppercase text-muted">
                        Thời lượng
                      </p>
                      <p className="font-black">{course.duration_weeks} tuần</p>
                    </div>
                    <div className="rounded-xl bg-white p-4">
                      <Users className="mb-2 text-primary" size={20} />
                      <p className="text-xs font-black uppercase text-muted">
                        Sĩ số
                      </p>
                      <p className="font-black">
                        {course.current_students}/{course.max_students}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <CalendarDays className="mb-2 text-primary" size={20} />
                    <p className="text-xs font-black uppercase text-muted">
                      Khai giảng
                    </p>
                    <p className="font-black">
                      {formatDate(course.start_date)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <Dumbbell className="mb-2 text-primary" size={20} />
                    <p className="text-xs font-black uppercase text-muted">
                      Cấp độ
                    </p>
                    <p className="font-black">
                      {levelLabels[course.level] || course.level}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {isEnrolled ? (
                    <Link
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-black text-white"
                      href="/my-courses"
                      onClick={closeDialog}
                    >
                      Xem khóa học của tôi
                    </Link>
                  ) : isAuthenticated ? (
                    <>
                      <AddToCartButton
                        course={cartItem}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-white px-4 text-sm font-black text-primary hover:bg-primary-soft"
                      />
                      <Link
                        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-black text-white"
                        href={`/courses/${course.id}`}
                        onClick={closeDialog}
                      >
                        Thanh toán khóa học
                      </Link>
                    </>
                  ) : (
                    <Link
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-black text-white"
                      href={`/login?next=/courses/${course.id}`}
                      onClick={closeDialog}
                    >
                      Đăng nhập để đăng ký
                    </Link>
                  )}
                </div>
              </aside>
            </div>
          </section>
        </div>
      ) : null}
      {open && coachOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4">
          <button
            aria-label="Đóng chi tiết HLV"
            className="absolute inset-0"
            onClick={() => setCoachOpen(false)}
            type="button"
          />
          <section className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-muted">
                  Chi tiết HLV
                </p>
                <p className="mt-1 text-xl font-black text-primary">
                  {coachName}
                </p>
              </div>
              <button
                aria-label="Đóng"
                className="inline-flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary hover:bg-[#ffe1e9]"
                onClick={() => setCoachOpen(false)}
                type="button"
              >
                <X size={22} />
              </button>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div
                aria-label={`Avatar của ${coachName}`}
                className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-lg font-black text-primary"
                style={{
                  backgroundImage: `url(${coachAvatar})`,
                  backgroundSize: "cover",
                }}
              />
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted">
                  Thông tin nổi bật
                </p>
                <p className="text-lg font-black">{coachName}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm font-bold text-muted">
              {coachPopupDetails.map((detail, index) => (
                <p key={`coach-detail-${course.id}-${index}`}>{detail}</p>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
