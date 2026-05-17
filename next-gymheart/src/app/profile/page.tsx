import { redirect } from "next/navigation";
import { Camera, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { updateProfileAction } from "@/lib/profile/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRow = {
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  role: string;
};

const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  coach: "Huấn luyện viên",
  user: "Học viên",
};

const errorMessages: Record<string, string> = {
  current_password: "Mật khẩu hiện tại không đúng.",
  missing_name: "Vui lòng nhập họ tên.",
  password_short: "Mật khẩu mới phải có ít nhất 6 ký tự.",
  save_failed: "Chưa lưu được thông tin. Bạn thử lại nhé.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  if (!session) {
    redirect("/login?next=/profile");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("email, full_name, phone, avatar_url, date_of_birth, gender, address, role")
    .eq("id", session.userId)
    .single();

  const profile = data as ProfileRow | null;
  if (!profile) {
    redirect("/login");
  }

  const avatarUrl =
    profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=f42559&color=fff&size=300`;

  return (
    <section className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-primary">Tài khoản</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Hồ sơ cá nhân</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Cập nhật thông tin liên hệ, ảnh đại diện và mật khẩu đăng nhập.
          </p>
        </div>
      </div>

      {params.updated ? (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">
          Đã lưu thay đổi hồ sơ.
        </div>
      ) : null}

      {params.error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {errorMessages[params.error] || "Có lỗi xảy ra."}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-xl border border-pink-100 bg-white p-6 text-center shadow-sm">
          <div
            className="mx-auto size-32 rounded-full border-4 border-white bg-cover bg-center shadow-md ring-2 ring-primary"
            style={{ backgroundImage: `url(${avatarUrl})` }}
          />
          <h2 className="mt-5 text-2xl font-black">{profile.full_name}</h2>
          <p className="mt-2 break-all text-sm font-bold text-muted">{profile.email}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-black text-primary">
            <ShieldCheck size={16} />
            {roleLabels[profile.role] || profile.role}
          </span>
        </aside>

        <form
          action={updateProfileAction}
          className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-black">Họ tên</span>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  className="h-12 w-full rounded-lg border border-pink-200 bg-white pl-11 pr-4 outline-none focus:border-primary"
                  defaultValue={profile.full_name}
                  name="full_name"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black">Email</span>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  className="h-12 w-full rounded-lg border border-pink-100 bg-gray-50 pl-11 pr-4 text-muted"
                  defaultValue={profile.email}
                  disabled
                />
              </div>
            </label>

            <Field label="Số điện thoại" name="phone" defaultValue={profile.phone || ""} placeholder="0901234567" />
            <Field label="Ngày sinh" name="date_of_birth" defaultValue={profile.date_of_birth || ""} type="date" />

            <label className="block">
              <span className="mb-2 block text-sm font-black">Giới tính</span>
              <select
                className="h-12 w-full rounded-lg border border-pink-200 bg-white px-4 outline-none focus:border-primary"
                defaultValue={profile.gender || ""}
                name="gender"
              >
                <option value="">Chưa chọn</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black">Ảnh đại diện</span>
              <div className="relative">
                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  className="h-12 w-full rounded-lg border border-pink-200 bg-white pl-11 pr-4 outline-none focus:border-primary"
                  defaultValue={profile.avatar_url || ""}
                  name="avatar_url"
                  placeholder="https://..."
                />
              </div>
            </label>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-black">Địa chỉ</span>
            <textarea
              className="min-h-28 w-full resize-y rounded-lg border border-pink-200 bg-white p-4 outline-none focus:border-primary"
              defaultValue={profile.address || ""}
              name="address"
              placeholder="Địa chỉ liên hệ"
            />
          </label>

          <div className="mt-6 rounded-xl border border-pink-100 bg-primary-soft p-5">
            <h3 className="text-lg font-black">Đổi mật khẩu</h3>
            <p className="mt-1 text-sm text-muted">
              Để trống phần này nếu bạn không muốn đổi mật khẩu.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field autoComplete="current-password" label="Mật khẩu hiện tại" name="current_password" type="password" />
              <Field autoComplete="new-password" label="Mật khẩu mới" minLength={6} name="new_password" type="password" />
            </div>
          </div>

          <button
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-black text-white hover:opacity-90"
            type="submit"
          >
            <Save size={18} />
            Lưu thay đổi
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black">{label}</span>
      <input
        className="h-12 w-full rounded-lg border border-pink-200 bg-white px-4 outline-none focus:border-primary"
        {...props}
      />
    </label>
  );
}
