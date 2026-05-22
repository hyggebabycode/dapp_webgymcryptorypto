import { CourseCard } from "@/components/course-card";
import { RealtimeFilter } from "@/components/realtime-filter";
import { getSession } from "@/lib/auth/session";
import { baseAmountToTest } from "@/lib/currency";
import { getCourses, getEnrolledCourseIds } from "@/lib/data/courses";

export const dynamic = "force-dynamic";

const levelOptions = [
  { value: "", label: "Tất cả cấp độ" },
  { value: "beginner", label: "Mới bắt đầu" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "advanced", label: "Nâng cao" },
  { value: "all_levels", label: "Mọi cấp độ" },
];

const priceSortOptions = [
  { value: "", label: "Sắp xếp theo giá" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
];

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; level?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const [courses, enrolledCourseIds] = await Promise.all([
    getCourses(),
    getEnrolledCourseIds(session?.userId),
  ]);
  const sortedCourses = courses.slice().sort((left, right) => {
    if (params.sort === "price_asc") {
      return baseAmountToTest(left.price) - baseAmountToTest(right.price);
    }
    if (params.sort === "price_desc") {
      return baseAmountToTest(right.price) - baseAmountToTest(left.price);
    }
    return 0;
  });

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black">Khóa học</h1>
        <p className="mt-3 text-lg text-muted">
          Tìm kiếm và đăng ký các khóa học phù hợp với mục tiêu của bạn.
        </p>
      </div>

      <RealtimeFilter
        className="mb-8"
        initialQuery={params.search || ""}
        initialSelect={params.level || ""}
        initialSort={params.sort || ""}
        placeholder="Tìm kiếm khóa học..."
        scopeId="course-list"
        selectDataKey="level"
        selectLabel="Cấp độ"
        selectOptions={levelOptions}
        sortDataKey="sortPrice"
        sortLabel="Sắp xếp theo giá"
        sortOptions={priceSortOptions}
      />

      {sortedCourses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" id="course-list">
          {sortedCourses.map((course) => (
            <div
              data-filter-item
              data-level={course.level}
              data-sort-price={baseAmountToTest(course.price)}
              data-search={`${course.course_name} ${course.description || ""} ${course.coach?.full_name || ""}`}
              key={course.id}
            >
              <CourseCard
                course={course}
                isAuthenticated={Boolean(session)}
                isEnrolled={enrolledCourseIds.has(course.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border-soft bg-white p-8 text-center text-muted">
          Không tìm thấy khóa học phù hợp.
        </div>
      )}
    </section>
  );
}
