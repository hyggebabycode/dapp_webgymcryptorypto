import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Clock, CreditCard, Users } from "lucide-react";
import QRCode from "qrcode";
import { CheckInQrDialog } from "@/components/attendance/check-in-qr-dialog";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { CourseRoadmapDialog } from "@/components/course-roadmap-dialog";
import { RealtimeFilter } from "@/components/realtime-filter";
import { createCheckInToken } from "@/lib/attendance/actions";
import { cancelEnrollmentAction } from "@/lib/courses/actions";
import { getSession } from "@/lib/auth/session";
import { formatBaseAsTest } from "@/lib/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CourseInfo = {
  id: string;
  course_name: string;
  description: string | null;
  image_url: string | null;
  duration_weeks: number;
  level: string;
  max_students: number;
  current_students: number;
};

type EnrollmentRow = {
  id: string;
  status: string;
  payment_status: string | null;
  payment_amount: number | null;
  courses: CourseInfo | CourseInfo[] | null;
};

const levelLabels: Record<string, string> = {
  beginner: "Mới bắt đầu",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
  all_levels: "Mọi cấp độ",
};

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang học" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "pending", label: "Chờ thanh toán" },
];

function getCourse(course: EnrollmentRow["courses"]) {
  return Array.isArray(course) ? course[0] : course;
}

function normalizedStatus(enrollment: EnrollmentRow) {
  return enrollment.payment_status !== "paid" ? "pending" : enrollment.status;
}

function isCheckInEnabled(enrollment: EnrollmentRow) {
  return (
    enrollment.payment_status === "paid" &&
    ["active", "completed"].includes(enrollment.status)
  );
}

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tab?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/my-courses");
  }

  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("class_enrollments")
    .select("id, status, payment_status, payment_amount, courses!inner(id, course_name, description, image_url, duration_weeks, level, max_students, current_students)")
    .eq("user_id", session.userId)
    .eq("courses.is_active", true)
    .neq("status", "cancelled")
    .order("enrollment_date", { ascending: false });

  const enrollments = (data || []) as EnrollmentRow[];
  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;
  const checkInQrByEnrollment = new Map(
    await Promise.all(
      enrollments
        .filter((enrollment) => isCheckInEnabled(enrollment))
        .map(async (enrollment) => {
          const course = getCourse(enrollment.courses);
          const token = createCheckInToken({
            courseId: course?.id || enrollment.id,
            enrollmentId: enrollment.id,
            userId: session.userId,
          });
          const checkInUrl = `${origin}/check-in?token=${encodeURIComponent(token)}`;
          const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 320,
          });

          return [enrollment.id, { checkInUrl, qrDataUrl }] as const;
        }),
    ),
  );

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black">Khóa học của tôi</h1>
        <p className="mt-3 text-lg text-muted">Theo dõi tiến độ và quản lý các khóa học đã đăng ký.</p>
      </div>

      <RealtimeFilter
        className="mb-8"
        initialQuery={params.search || ""}
        initialSelect={params.tab || ""}
        placeholder="Tìm kiếm khóa học của tôi..."
        scopeId="my-courses-list"
        selectDataKey="status"
        selectLabel="Trạng thái"
        selectOptions={statusOptions}
      />

      {enrollments.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2" id="my-courses-list">
          {enrollments.map((enrollment) => {
            const course = getCourse(enrollment.courses);
            if (!course) return null;
            const status = normalizedStatus(enrollment);

            return (
              <article
                className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-sm"
                data-filter-item
                data-search={`${course.course_name} ${course.description || ""} ${status}`}
                data-status={status}
                key={enrollment.id}
              >
                <div
                  className="h-40 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${course.image_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"})`,
                  }}
                />
                <div className="p-6">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase text-green-700">
                      {status === "completed" ? "Hoàn thành" : status === "pending" ? "Chờ thanh toán" : "Đang học"}
                    </span>
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-primary">
                      {levelLabels[course.level] || "Mọi cấp độ"}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{course.course_name}</h2>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{course.description}</p>

                  <div className="mt-5 grid gap-2 text-sm font-bold text-muted">
                    <p className="flex items-center gap-2">
                      <Clock size={16} className="text-primary" />
                      {course.duration_weeks} tuần
                    </p>
                    <p className="flex items-center gap-2">
                      <Users size={16} className="text-primary" />
                      {course.current_students}/{course.max_students} học viên
                    </p>
                    <p className="flex items-center gap-2 text-primary">
                      <CreditCard size={16} />
                      {formatBaseAsTest(enrollment.payment_amount)}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    {status === "pending" ? (
                      <Link
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-white hover:opacity-90"
                        href={`/courses/${course.id}`}
                      >
                        Thanh toán
                      </Link>
                    ) : (
                      <CourseRoadmapDialog
                        buttonClassName="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-white hover:opacity-90"
                        courseId={course.id}
                        courseName={course.course_name}
                        label={status === "completed" ? "Xem lại lộ trình" : "Tiếp tục học"}
                      />
                    )}
                    {checkInQrByEnrollment.has(enrollment.id) ? (
                      <CheckInQrDialog
                        courseName={course.course_name}
                        qrDataUrl={checkInQrByEnrollment.get(enrollment.id)!.qrDataUrl}
                      />
                    ) : null}
                    <form action={cancelEnrollmentAction}>
                      <input name="enrollment_id" type="hidden" value={enrollment.id} />
                      <ConfirmSubmitButton
                        className="h-11 w-full rounded-lg bg-primary-soft px-4 text-sm font-black text-primary hover:bg-pink-100 sm:w-24"
                        message={`Hủy đăng ký khóa ${course.course_name}?`}
                      >
                        Hủy
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border-soft bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-lg font-black">Không có khóa học phù hợp.</p>
          <p className="mt-2 text-muted">Thử đổi từ khóa tìm kiếm hoặc trạng thái.</p>
        </div>
      )}
    </section>
  );
}
