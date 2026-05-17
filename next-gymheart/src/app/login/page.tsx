import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Heart,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { MetaMaskLoginButton } from "@/components/auth/metamask-login-button";
import { MetaMaskRegisterButton } from "@/components/auth/metamask-register-button";
import { PasswordField } from "@/components/auth/password-field";
import { loginAction, signupAction } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";

const errorMessages: Record<string, string> = {
  missing: "Vui lòng nhập email và mật khẩu.",
  invalid: "Email hoặc mật khẩu không đúng.",
  inactive: "Tài khoản đã bị khóa.",
  signup_missing: "Vui lòng nhập đầy đủ thông tin đăng ký.",
  password_short: "Mật khẩu phải có ít nhất 6 ký tự.",
  email_exists: "Email này đã được đăng ký.",
  signup_failed: "Không thể tạo tài khoản. Vui lòng thử lại.",
  wallet_invalid: "Không xác thực được ví MetaMask. Hãy chọn đúng ví đã đăng ký và ký lại yêu cầu.",
  wallet_not_registered: "Ví này chưa có tài khoản. Hãy chuyển sang tab Đăng ký và đăng ký nhanh với MetaMask.",
  wallet_signup_failed: "Không thể tạo tài khoản bằng MetaMask. Vui lòng thử lại.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; mode?: string; registered?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const isSignup = params.mode === "signup";

  if (session) {
    if (params.next?.startsWith("/") && !params.next.startsWith("//")) {
      redirect(params.next);
    }

    redirect(`/dashboard/${session.role}`);
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl md:grid-cols-2">
        <div className="relative hidden min-h-[600px] overflow-hidden md:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/img/csvc/thietbi1.jpg')" }}
          />
          <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/75 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end p-10 text-white">
            <h1 className="max-w-sm text-4xl font-black leading-tight">
              Mạnh mẽ hơn
              <br />
              mỗi ngày.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-white/90">
              Tham gia cộng đồng GymHeart để nhận lộ trình tập luyện cá nhân hóa
              và sự hỗ trợ nhiệt tình nhất.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden p-8 sm:p-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
            <div className="grid grid-cols-8 gap-5 p-6 text-primary">
              {Array.from({ length: 80 }).map((_, index) => (
                <Heart key={index} className="fill-current" />
              ))}
            </div>
          </div>

          <Heart className="absolute right-6 top-6 fill-pink-200 text-pink-200" />

          <div className="relative z-10 mx-auto max-w-md">
            <h2 className="mt-8 text-3xl font-black">Chào mừng bạn!</h2>
            <p className="mt-3 text-sm font-semibold text-muted">
              Vui lòng đăng nhập hoặc tạo tài khoản mới để bắt đầu.
            </p>

            <div className="mt-9 flex gap-7 border-b border-pink-200">
              <Link
                className={`border-b-2 pb-3 text-sm font-black ${
                  !isSignup
                    ? "border-primary text-[#1c0d11]"
                    : "border-transparent text-muted hover:text-primary"
                }`}
                href="/login"
              >
                Đăng nhập
              </Link>
              <Link
                className={`border-b-2 pb-3 text-sm font-black ${
                  isSignup
                    ? "border-primary text-[#1c0d11]"
                    : "border-transparent text-muted hover:text-primary"
                }`}
                href="/login?mode=signup"
              >
                Đăng ký
              </Link>
            </div>

            {params.registered ? (
              <div className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.
              </div>
            ) : null}

            {params.error ? (
              <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {errorMessages[params.error] || "Không thể xử lý yêu cầu."}
              </div>
            ) : null}

            {isSignup ? (
              <div className="mt-7 space-y-5">
                <MetaMaskRegisterButton />

                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wide text-muted">
                  <span className="h-px flex-1 bg-pink-100" />
                  Hoặc đăng ký bằng thông tin
                  <span className="h-px flex-1 bg-pink-100" />
                </div>

                <form action={signupAction} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-black">Họ và tên</label>
                    <div className="relative">
                      <UserRound
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        size={20}
                      />
                      <input
                        className="h-14 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] pl-12 pr-4 outline-none focus:border-primary"
                        name="full_name"
                        placeholder="Nguyễn Văn A"
                        required
                        type="text"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black">Địa chỉ Email</label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        size={20}
                      />
                      <input
                        className="h-14 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] pl-12 pr-4 outline-none focus:border-primary"
                        name="email"
                        placeholder="example@email.com"
                        required
                        type="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black">Số điện thoại</label>
                    <div className="relative">
                      <Phone
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        size={20}
                      />
                      <input
                        className="h-14 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] pl-12 pr-4 outline-none focus:border-primary"
                        name="phone"
                        placeholder="0901234567"
                        required
                        type="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <PasswordField
                      autoComplete="new-password"
                      label="Mật khẩu"
                      minLength={6}
                      name="password"
                    />
                    <p className="mt-2 text-xs font-bold text-muted">Mật khẩu phải có ít nhất 6 ký tự.</p>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-black">Loại tài khoản</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-pink-200 bg-white px-4 py-3 text-sm font-bold">
                        <input
                          className="size-5 accent-primary"
                          defaultChecked
                          name="role"
                          type="radio"
                          value="user"
                        />
                        Thành viên
                      </label>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-pink-200 bg-white px-4 py-3 text-sm font-bold">
                        <input className="size-5 accent-primary" name="role" type="radio" value="coach" />
                        Huấn luyện viên (PT)
                      </label>
                    </div>
                    <p className="mt-2 text-xs font-bold text-muted">
                      Nếu đăng ký làm PT, yêu cầu sẽ được gửi đến Admin để xét duyệt.
                    </p>
                  </div>

                  <div className="rounded-xl border border-pink-100 bg-white p-4">
                    <div className="mb-4">
                      <h3 className="font-black">Hồ sơ ứng tuyển PT</h3>
                      <p className="mt-1 text-xs font-bold text-muted">
                        Chỉ cần nhập nếu bạn chọn “Huấn luyện viên (PT)”. Admin sẽ xem các thông tin này trước khi duyệt.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        <span className="mb-2 block text-sm font-black">Chuyên môn</span>
                        <input
                          className="h-12 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 outline-none focus:border-primary"
                          name="specialization"
                          placeholder="Fitness, Yoga, Boxing..."
                        />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-black">Số năm kinh nghiệm</span>
                        <input
                          className="h-12 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 outline-none focus:border-primary"
                          min="0"
                          name="years_of_experience"
                          type="number"
                          defaultValue={0}
                        />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-2 block text-sm font-black">Chứng chỉ</span>
                        <input
                          className="h-12 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 outline-none focus:border-primary"
                          name="certification"
                          placeholder="ACE, NASM, ISSA, Yoga Alliance..."
                        />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-2 block text-sm font-black">Giới thiệu kinh nghiệm</span>
                        <textarea
                          className="min-h-24 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 py-3 outline-none focus:border-primary"
                          name="bio"
                          placeholder="Bạn từng huấn luyện nhóm học viên nào, thế mạnh là gì, phong cách giảng dạy ra sao?"
                        />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-black">Thời gian có thể dạy</span>
                        <textarea
                          className="min-h-20 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 py-3 outline-none focus:border-primary"
                          name="availability"
                          placeholder="VD: Tối T2-T6, sáng cuối tuần"
                        />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-black">Link hồ sơ</span>
                        <textarea
                          className="min-h-20 w-full rounded-lg border border-pink-200 bg-[#fcf8f9] px-4 py-3 outline-none focus:border-primary"
                          name="portfolio_url"
                          placeholder="Facebook, website cá nhân, chứng chỉ online..."
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-primary text-lg font-black text-white shadow-lg shadow-primary/25 hover:opacity-90"
                    type="submit"
                  >
                    Đăng ký
                    <ArrowRight size={22} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="mt-7 space-y-5">
                <MetaMaskLoginButton />

                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wide text-muted">
                  <span className="h-px flex-1 bg-pink-100" />
                  Hoặc đăng nhập bằng email
                  <span className="h-px flex-1 bg-pink-100" />
                </div>

                <form action={loginAction} className="space-y-5">
                  <input type="hidden" name="next" value={params.next || ""} />
                  <div>
                    <label className="mb-2 block text-sm font-black">Địa chỉ Email</label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        size={20}
                      />
                      <input
                        className="h-14 w-full rounded-lg border border-pink-200 bg-blue-50 pl-12 pr-4 outline-none focus:border-primary"
                        name="email"
                        placeholder="admin@gymheart.com"
                        required
                        type="email"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-end">
                      <Link href="/login" className="text-xs font-bold text-primary">
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <PasswordField
                      autoComplete="current-password"
                      inputClassName="bg-blue-50"
                      label="Mật khẩu"
                      name="password"
                    />
                  </div>

                  <button
                    className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-primary text-lg font-black text-white shadow-lg shadow-primary/25 hover:opacity-90"
                    type="submit"
                  >
                    Đăng nhập
                    <ArrowRight size={22} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
