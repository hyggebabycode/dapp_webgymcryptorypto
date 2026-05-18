import Link from "next/link";
import { Award, Phone, Search, UserCheck } from "lucide-react";
import { AddCoachDialog } from "@/components/admin/add-coach-dialog";
import { UserRowActions, type AdminUserRecord } from "@/components/admin/user-row-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function parseCvStoragePath(note?: string | null) {
  const match = (note || "").match(/Đường dẫn storage:\s*([^\s]+)/i);
  return match?.[1] || null;
}

function parseCvPublicPath(note?: string | null) {
  const match = (note || "").match(/Đường dẫn file:\s*([^\s]+)/i);
  const publicPath = match?.[1] || null;
  return publicPath?.startsWith("/uploads/") ? publicPath : null;
}

function parseCvLabel(note?: string | null) {
  const match = (note || "").match(/File chứng nhận\/CV:\s*([^\n]+)/i);
  return match?.[1] || null;
}

async function getSignedCvUrl(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  note?: string | null,
) {
  const storagePath = parseCvStoragePath(note);
  if (!storagePath) return null;

  const [bucket, ...pathParts] = storagePath.split("/");
  const path = pathParts.join("/");
  if (!bucket || !path) return null;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
  if (error) return null;
  return data.signedUrl;
}

function messageText(updated?: string, error?: string) {
  if (updated) return "Đã cập nhật huấn luyện viên thành công.";
  if (error === "self_delete") return "Không thể xóa tài khoản đang đăng nhập.";
  if (error === "self_status") return "Không thể tự vô hiệu hóa tài khoản đang đăng nhập.";
  if (error === "image_invalid") return "Ảnh tải lên phải là file ảnh và dung lượng không quá 3MB.";
  if (error) return "Không thể xử lý yêu cầu. Kiểm tra dữ liệu rồi thử lại.";
  return null;
}

export default async function AdminCoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const keyword = (params.q || "").trim().toLowerCase();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, email, phone, avatar_url, bio, role, requested_role, specialization, years_of_experience, certification, is_active, created_at, pt_request_note")
    .eq("role", "coach")
    .order("full_name");

  const coaches = ((data || []) as AdminUserRecord[]).filter((coach) => {
    return (
      !keyword ||
      coach.full_name.toLowerCase().includes(keyword) ||
      coach.email.toLowerCase().includes(keyword) ||
      (coach.phone || "").toLowerCase().includes(keyword) ||
      (coach.specialization || "").toLowerCase().includes(keyword)
    );
  });
  const coachesWithCv = await Promise.all(
    coaches.map(async (coach) => {
      const noteSignedUrl = await getSignedCvUrl(supabase, coach.pt_request_note);
      const publicFileUrl = parseCvPublicPath(coach.pt_request_note);

      return {
        ...coach,
        cvSignedUrl: noteSignedUrl || publicFileUrl || null,
        cvLabel: parseCvLabel(coach.pt_request_note) || null,
      };
    }),
  );
  const message = messageText(params.updated, params.error);

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black">Huấn Luyện Viên</h1>
          <p className="mt-2 text-sm text-muted">Quản lý hồ sơ, chuyên môn, trạng thái và tài khoản HLV.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-10 items-center rounded-lg border border-primary px-4 text-sm font-black text-primary hover:bg-primary hover:text-white"
            href="/dashboard/admin/enrollments#pt-requests"
          >
            Duyệt yêu cầu HLV
          </Link>
          <AddCoachDialog />
        </div>
      </div>

      {message ? (
        <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-bold ${params.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      ) : null}

      <form className="mb-6">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" size={18} />
          <input
            className="h-11 w-full rounded-lg border border-pink-100 bg-white pl-11 pr-4 text-sm outline-none focus:border-primary"
            defaultValue={params.q || ""}
            name="q"
            placeholder="Tìm HLV, email, số điện thoại, chuyên môn..."
          />
        </label>
      </form>

      <div className="space-y-4">
        {coachesWithCv.map((coach) => (
          <article className="rounded-2xl border border-pink-100 bg-background p-5 hover:border-primary" key={coach.id}>
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_280px] xl:items-center">
              <div className="flex items-start gap-4">
                <div
                  className="size-16 shrink-0 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${coach.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.full_name)}&background=f42559&color=fff`})`,
                  }}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{coach.full_name}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${coach.is_active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                      {coach.is_active ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{coach.email}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{coach.bio || "Chưa có phần giới thiệu."}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 font-bold">
                  <Phone size={16} className="text-primary" />
                  {coach.phone || "Chưa cập nhật số điện thoại"}
                </p>
                <p className="flex items-center gap-2 font-bold">
                  <UserCheck size={16} className="text-primary" />
                  {coach.specialization || "Chưa cập nhật chuyên môn"}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-black text-primary">{coach.years_of_experience ?? 0}</span> năm kinh nghiệm
                </p>
                <p className="flex items-start gap-2 text-muted">
                  <Award size={16} className="mt-0.5 text-primary" />
                  {coach.certification || "Chưa cập nhật chứng chỉ"}
                </p>
              </div>
              <UserRowActions user={coach} mode="coaches" />
            </div>
          </article>
        ))}

        {coachesWithCv.length === 0 ? (
          <div className="rounded-xl bg-primary-soft px-4 py-5 text-sm font-bold text-muted">
            Chưa tìm thấy huấn luyện viên phù hợp.
          </div>
        ) : null}
      </div>
    </section>
  );
}
