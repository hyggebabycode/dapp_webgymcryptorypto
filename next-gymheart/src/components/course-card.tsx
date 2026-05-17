import Link from "next/link";
import { Clock, UserRound, Users } from "lucide-react";
import { AddToCartButton, type CartItem } from "@/components/cart/add-to-cart-button";
import { CourseDetailDialog } from "@/components/course-detail-dialog";
import { CourseRoadmapDialog } from "@/components/course-roadmap-dialog";
import { formatBaseAsTest } from "@/lib/currency";
import type { Course } from "@/lib/data/courses";

const levelLabels: Record<string, string> = {
  beginner: "Mới bắt đầu",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
  all_levels: "Mọi cấp độ",
};

export function CourseCard({
  course,
  isAuthenticated = false,
  isEnrolled = false,
}: {
  course: Course;
  isAuthenticated?: boolean;
  isEnrolled?: boolean;
}) {
  const cartItem: CartItem = {
    id: course.id,
    course_name: course.course_name,
    description: course.description,
    price: Number(course.price || 0),
    duration_weeks: Number(course.duration_weeks || 0),
    max_students: Number(course.max_students || 0),
    current_students: Number(course.current_students || 0),
    image_url: course.image_url,
  };
  const coachName = course.coach?.full_name || "Chưa gán HLV";

  return (
    <article className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-sm">
      <CourseDetailDialog
        cartItem={cartItem}
        course={course}
        isAuthenticated={isAuthenticated}
        isEnrolled={isEnrolled}
      />
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-black text-primary">
            {levelLabels[course.level] || "Tất cả"}
          </span>
          {isEnrolled ? (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
              Đã đăng ký
            </span>
          ) : null}
        </div>

        <h3 className="text-lg font-black">{course.course_name}</h3>
        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-muted">
          {course.description}
        </p>

        <div className="mt-4 grid gap-2 text-sm text-muted">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{course.duration_weeks} tuần</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>
              {course.current_students}/{course.max_students} học viên
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserRound size={16} />
            <span>HLV: {coachName}</span>
          </div>
        </div>

        <div className="mt-5 border-t border-border-soft pt-4">
          <p className="mb-4 text-2xl font-black text-primary">
            {formatBaseAsTest(course.price)}
          </p>
          <CourseRoadmapDialog courseId={course.id} courseName={course.course_name} />

          {isEnrolled ? (
            <button
              className="h-11 w-full cursor-not-allowed rounded-full bg-gray-300 text-sm font-black text-gray-700"
              disabled
              type="button"
            >
              Đã đăng ký
            </button>
          ) : isAuthenticated ? (
            <div className="grid grid-cols-[1fr_1.1fr] gap-2">
              <AddToCartButton course={cartItem} />
              <Link
                href={`/courses/${course.id}`}
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-black text-white hover:opacity-90"
              >
                Đăng ký ngay
              </Link>
            </div>
          ) : (
            <Link
              href={`/login?next=/courses/${course.id}`}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-black text-white hover:opacity-90"
            >
              Đăng nhập để đăng ký
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
