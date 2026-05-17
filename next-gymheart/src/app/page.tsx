import Link from "next/link";
import { Award, HeartHandshake, MapPin, Phone, Users } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { getSession } from "@/lib/auth/session";
import { getEnrolledCourseIds, getFeaturedCourses } from "@/lib/data/courses";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const [courses, enrolledCourseIds] = await Promise.all([
    getFeaturedCourses(3),
    getEnrolledCourseIds(session?.userId),
  ]);

  return (
    <div>
      <section
        id="home"
        className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/img/csvc/Thiet-ke-phong-gym-chuyen-nghiep-mang-lai-su-uy-tin-cho-co-so-kinh-doanh.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35" />

        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-10">
          <div className="max-w-5xl">
            <div className="mb-8 inline-flex rounded-full border border-primary/50 bg-primary/25 px-5 py-3 text-sm font-black text-white backdrop-blur">
              Chào mừng bạn đến với GymHeart
            </div>
            <h1 className="max-w-5xl text-5xl font-black leading-tight text-white sm:text-7xl lg:text-[5.25rem]">
              Thay Đổi Bản Thân
              <span className="mt-2 block text-primary">
                Mỗi Ngày Một Chút
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg font-semibold leading-8 text-white/90 sm:text-xl">
              Chúng tôi cung cấp lộ trình tập luyện cá nhân hóa, huấn luyện viên
              chuyên nghiệp và cơ sở vật chất hiện đại.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={session ? "/courses" : "/login"}
                className="inline-flex h-14 items-center rounded-lg bg-primary px-8 text-lg font-black text-white shadow-2xl hover:scale-[1.02] hover:opacity-95"
              >
                Bắt Đầu Ngay
              </Link>
              <Link
                href="/services"
                className="inline-flex h-14 items-center rounded-lg border-2 border-white/60 bg-white/10 px-8 text-lg font-black text-white backdrop-blur hover:bg-white/20"
              >
                Xem Khóa Học
              </Link>
            </div>

            <div className="mt-12 inline-grid grid-cols-3 gap-x-10 border-t border-white/25 pt-8">
              <div>
                <p className="text-3xl font-black text-white">500+</p>
                <p className="mt-1 text-xs font-bold text-white/70">Học viên</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">20+</p>
                <p className="mt-1 text-xs font-bold text-white/70">HLV Pro</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">15+</p>
                <p className="mt-1 text-xs font-bold text-white/70">Khóa học</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-10">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-black">Không Gian Tập Luyện Đẳng Cấp</h2>
            <p className="mt-4 text-lg text-muted">
              Thiết bị hiện đại, phòng tập sạch đẹp và không gian phù hợp cho mọi mục tiêu.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative h-[410px] overflow-hidden rounded-xl bg-[url('/img/csvc/thietbi1.jpg')] bg-cover bg-center shadow-xl md:col-span-2 md:row-span-2" />
            {["thietbi2.webp", "lophoc.jpg", "huanluyenvien.webp", "OIP.jpg"].map(
              (image) => (
                <div
                  key={image}
                  className="h-[197px] overflow-hidden rounded-xl bg-cover bg-center shadow-lg"
                  style={{ backgroundImage: `url('/img/csvc/${image}')` }}
                />
              ),
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-4xl font-black">Các Khóa Học</h2>
            <p className="mt-3 text-lg text-muted">
              Chọn chương trình phù hợp với lịch tập và mục tiêu của bạn.
            </p>
          </div>
          <Link href="/services" className="font-black text-primary">
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isAuthenticated={Boolean(session)}
              isEnrolled={enrolledCourseIds.has(course.id)}
            />
          ))}
        </div>
      </section>

      <section id="community" className="bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-10">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-black">Cộng Đồng GymHeart</h2>
            <p className="mt-4 text-lg text-muted">
              Tập luyện cùng nhau, tiến bộ cùng nhau.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: "Cộng đồng thân thiện" },
              { icon: Award, title: "Thử thách hằng tháng" },
              { icon: HeartHandshake, title: "HLV đồng hành" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border-soft bg-background p-6 text-center"
              >
                <item.icon className="mx-auto mb-4 text-primary" size={34} />
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Môi trường tập luyện tích cực, phù hợp cho người mới bắt đầu
                  lẫn người đã có kinh nghiệm.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 sm:px-10 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-black">Liên Hệ</h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              GymHeart luôn sẵn sàng tư vấn lộ trình phù hợp nhất cho bạn.
            </p>
          </div>
          <div className="rounded-xl border border-border-soft bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <MapPin className="text-primary" />
              <p className="font-bold">123 Fitness Street, TP. Hồ Chí Minh</p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-primary" />
              <p className="font-bold">0901 234 567</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-14 text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-5 px-4 text-center sm:px-10 md:flex-row md:text-left">
          <div>
            <h2 className="text-3xl font-black">Sẵn Sàng Thay Đổi?</h2>
            <p className="mt-2 text-white/80">Bắt đầu hành trình cùng GymHeart hôm nay.</p>
          </div>
          <Link
            href="/services"
            className="inline-flex h-12 items-center rounded-lg bg-white px-6 font-black text-primary"
          >
            Khám phá khóa học
          </Link>
        </div>
      </section>
    </div>
  );
}
