import Link from "next/link";
import { Award, Dumbbell } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Coach = {
  id: string;
  full_name: string;
  bio: string | null;
  specialization: string | null;
  years_of_experience: number | null;
  avatar_url: string | null;
};

export default async function CoachesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, bio, specialization, years_of_experience, avatar_url")
    .eq("role", "coach")
    .eq("is_active", true)
    .order("full_name");
  const coaches = (data || []) as Coach[];

  return (
    <section>
      <div className="bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-16 text-center sm:px-10">
          <h1 className="text-4xl font-black">Đội Ngũ HLV</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted">
            Huấn luyện viên giàu kinh nghiệm, tận tâm và luôn theo sát mục tiêu của học viên.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-10">
        <div className="grid gap-6 md:grid-cols-3">
          {coaches.map((coach) => (
            <article
              key={coach.id}
              className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-sm"
            >
              <div
                className="h-64 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${coach.avatar_url || "https://ui-avatars.com/api/?name=Coach&background=f42559&color=fff&size=400"})`,
                }}
              />
              <div className="p-6">
                <h2 className="text-xl font-black">{coach.full_name}</h2>
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-primary">
                  <Award size={16} />
                  <span>{coach.years_of_experience || 0}+ năm kinh nghiệm</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-muted">
                  <Dumbbell size={16} />
                  <span>{coach.specialization || "Fitness"}</span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">
                  {coach.bio || "Huấn luyện viên chuyên nghiệp của GymHeart."}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-xl bg-primary p-8 text-center text-white">
          <h2 className="text-3xl font-black">Đặt lịch với HLV ngay</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/85">
            Đăng ký khóa học để được tư vấn miễn phí và chọn HLV phù hợp với mục tiêu của bạn.
          </p>
          <Link
            href="/services"
            className="mt-6 inline-flex h-12 items-center rounded-lg bg-white px-6 font-black text-primary"
          >
            Xem khóa học
          </Link>
        </div>
      </div>
    </section>
  );
}
