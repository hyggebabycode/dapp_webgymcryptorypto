import { CalendarDays, Users } from "lucide-react";
import { AddCourseDialog } from "@/components/admin/add-course-dialog";
import { CourseCardActions, type CourseAdminRecord } from "@/components/admin/course-card-actions";
import { RealtimeFilter } from "@/components/realtime-filter";
import { formatBaseAsTest } from "@/lib/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CourseRow = CourseAdminRecord & {
  users: { full_name: string } | { full_name: string }[] | null;
};

type CoachOption = {
  id: string;
  full_name: string;
};

const levelLabel: Record<string, string> = {
  beginner: "Mới bắt đầu",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
  all_levels: "Mọi cấp độ",
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function messageText(updated?: string, error?: string) {
  if (updated) return "Đã cập nhật khóa học thành công.";
  if (error === "date_invalid") return "Ngày kết thúc phải sau ngày bắt đầu.";
  if (error === "coach_invalid") return "Huấn luyện viên được gán phải đang hoạt động.";
  if (error === "capacity_invalid") return "Sức chứa không được nhỏ hơn số học viên hiện tại.";
  if (error === "lesson_failed") return "Khóa học đã lưu nhưng lộ trình học chưa được cập nhật. Vui lòng thử sửa lại lộ trình.";
  if (error) return "Không thể xử lý khóa học. Vui lòng kiểm tra dữ liệu.";
  return null;
}

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [coursesResult, coachesResult] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id, course_name, description, price, duration_weeks, level, current_students, max_students, image_url, is_active, start_date, end_date, schedule_description, benefits, requirements, coach_id, users!courses_coach_id_fkey(full_name)",
      )
      .order("course_name"),
    supabase
      .from("users")
      .select("id, full_name")
      .eq("role", "coach")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const coaches = (coachesResult.data || []) as CoachOption[];
  const courses = (coursesResult.data || []) as CourseRow[];
  const message = messageText(params.updated, params.error);

  return (
    <section className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black">Quản lý khóa học</h1>
          <p className="mt-2 text-sm text-muted">Thêm, sửa, ẩn, xóa và theo dõi khóa học đang có trên hệ thống.</p>
        </div>
        <AddCourseDialog coaches={coaches} />
      </div>

      {message ? (
        <div className={`mb-5 rounded-lg px-4 py-3 text-sm font-bold ${params.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      ) : null}

      <RealtimeFilter
        className="mb-6"
        initialQuery={params.q || ""}
        initialSelect={params.status || ""}
        placeholder="Tìm khóa học, mô tả, HLV..."
        scopeId="admin-courses-list"
        selectDataKey="status"
        selectLabel="Trạng thái"
        selectOptions={[
          { value: "", label: "Tất cả trạng thái" },
          { value: "active", label: "Đang mở" },
          { value: "inactive", label: "Đã ẩn" },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-2" id="admin-courses-list">
        {courses.map((course) => {
          const coach = one(course.users);
          return (
            <article
              className="overflow-hidden rounded-xl border border-pink-100 bg-background"
              data-filter-item
              data-search={`${course.course_name} ${course.description || ""} ${coach?.full_name || ""} ${course.level}`}
              data-status={course.is_active ? "active" : "inactive"}
              key={course.id}
            >
              <div className="grid md:grid-cols-[220px_1fr]">
                <div
                  className="min-h-52 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${course.image_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600"})`,
                  }}
                />
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{course.course_name}</h3>
                      <p className="mt-1 text-sm text-muted">
                        {levelLabel[course.level] || course.level} · {course.duration_weeks} tuần · {coach?.full_name || "Chưa gán HLV"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${course.is_active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                      {course.is_active ? "Đang mở" : "Đã ẩn"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted">{course.description || "Chưa có mô tả."}</p>
                  <div className="mt-4 grid gap-2 text-sm text-muted md:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <Users size={16} /> {course.current_students}/{course.max_students} học viên
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays size={16} /> {course.schedule_description || "Chưa có lịch"}
                    </p>
                  </div>
                  <p className="mt-4 text-xl font-black text-primary">
                    {formatBaseAsTest(course.price)}
                  </p>
                  <CourseCardActions
                    coaches={coaches}
                    course={{
                      id: course.id,
                      course_name: course.course_name,
                      description: course.description,
                      price: course.price,
                      duration_weeks: course.duration_weeks,
                      level: course.level,
                      current_students: course.current_students,
                      max_students: course.max_students,
                      image_url: course.image_url,
                      is_active: course.is_active,
                      start_date: course.start_date,
                      end_date: course.end_date,
                      schedule_description: course.schedule_description,
                      benefits: course.benefits,
                      requirements: course.requirements,
                      coach_id: course.coach_id,
                    }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
