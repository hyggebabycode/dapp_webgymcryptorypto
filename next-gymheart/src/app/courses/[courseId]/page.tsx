import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, UserRound, Users } from "lucide-react";
import { Web3Button } from "@/components/web3-button";
import { getSession } from "@/lib/auth/session";
import { formatBaseAsTest } from "@/lib/currency";
import { getCourseById, getEnrolledCourseIds } from "@/lib/data/courses";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const [course, enrolledCourseIds, userResult] = await Promise.all([
    getCourseById(courseId),
    getEnrolledCourseIds(session?.userId),
    session
      ? supabase.from("users").select("wallet_address").eq("id", session.userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!course) notFound();

  const isEnrolled = enrolledCourseIds.has(course.id);
  const hasLinkedWallet = Boolean(userResult.data?.wallet_address);
  const coachName = course.coach?.full_name || "Chưa gán HLV";
  const coachDetails = course.coach
    ? [
        course.coach.specialization ? `Chuyên môn: ${course.coach.specialization}` : null,
        course.coach.years_of_experience != null
          ? `Kinh nghiệm: ${course.coach.years_of_experience} năm`
          : "Kinh nghiệm: Chưa cập nhật",
        course.coach.certification
          ? `Chứng chỉ: ${course.coach.certification}`
          : "Chứng chỉ: Chưa cập nhật",
      ]
    : [];
  if (!course.is_active && session?.role !== "admin" && !isEnrolled) {
    notFound();
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[1fr_380px]">
      <article className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-sm">
        <div
          className="h-72 bg-cover bg-center"
          style={{
            backgroundImage: `url(${course.image_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000"})`,
          }}
        />
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black">{course.course_name}</h1>
            {isEnrolled ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">
                <CheckCircle2 size={16} />
                Đã đăng ký
              </span>
            ) : null}
          </div>
          <p className="mt-4 whitespace-pre-line leading-8 text-muted">
            {course.description || "Khóa học đang được cập nhật mô tả chi tiết."}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-primary-soft p-4">
              <Clock className="mb-2 text-primary" size={20} />
              <p className="font-black">{course.duration_weeks} tuần</p>
            </div>
            <div className="rounded-lg bg-primary-soft p-4">
              <Users className="mb-2 text-primary" size={20} />
              <p className="font-black">
                {course.current_students}/{course.max_students} học viên
              </p>
            </div>
            <div className="rounded-lg bg-primary-soft p-4">
              <p className="text-sm font-bold text-muted">Học phí</p>
              <p className="mt-2 text-xl font-black text-primary">
                {formatBaseAsTest(course.price)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-primary-soft p-4">
            <UserRound className="mb-2 text-primary" size={20} />
            <p className="text-sm font-bold text-muted">HLV đứng lớp</p>
            <p className="mt-2 text-xl font-black">{coachName}</p>
            {course.coach ? (
              <div className="mt-2 space-y-1 text-sm font-bold text-muted">
                {coachDetails.map((detail, index) =>
                  detail ? <p key={`${course.id}-coach-${index}`}>{detail}</p> : null,
                )}
              </div>
            ) : null}
          </div>
        </div>
      </article>

      <aside>
        {isEnrolled ? (
          <div className="rounded-xl border border-border-soft bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Bạn đã đăng ký khóa học này</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Vào khu vực khóa học của tôi để theo dõi trạng thái và lịch tập.
            </p>
            <Link
              href="/dashboard/user"
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary font-black text-white"
            >
              Xem khóa học của tôi
            </Link>
          </div>
        ) : session ? (
          <Web3Button
            course={{
              id: course.id,
              price: Number(course.price),
              course_name: course.course_name,
            }}
            hasLinkedWallet={hasLinkedWallet}
          />
        ) : (
          <div className="rounded-xl border border-border-soft bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Đăng nhập để đăng ký</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Sau khi đăng nhập, bạn có thể thanh toán và mở khóa khóa học ngay.
            </p>
            <Link
              href={`/login?next=/courses/${course.id}`}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary font-black text-white"
            >
              Đăng nhập
            </Link>
          </div>
        )}
      </aside>
    </section>
  );
}
