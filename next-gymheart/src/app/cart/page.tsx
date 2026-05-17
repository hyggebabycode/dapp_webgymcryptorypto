import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, ShoppingCart, Trash2, Users } from "lucide-react";
import { clearCartAction, clearCartItemAction, getCartItems } from "@/lib/cart/actions";
import { getSession } from "@/lib/auth/session";
import { CartLocalSync } from "@/components/cart/cart-local-sync";
import { baseAmountToTest, formatBaseAsTest, formatTestAmount } from "@/lib/currency";
import { getEnrolledCourseIds } from "@/lib/data/courses";

export const dynamic = "force-dynamic";

async function removeCartItem(formData: FormData) {
  "use server";

  const courseId = String(formData.get("course_id") || "");
  await clearCartItemAction(courseId);
}

async function clearCart() {
  "use server";

  await clearCartAction();
}

export default async function CartPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/cart");
  }

  const [items, enrolledCourseIds] = await Promise.all([
    getCartItems(session.userId),
    getEnrolledCourseIds(session.userId),
  ]);
  const payableItems = items.filter((item) => !enrolledCourseIds.has(item.id));
  const total = payableItems.reduce((sum, item) => sum + baseAmountToTest(item.price), 0);

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-8">
      <CartLocalSync items={items} />
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white px-4 py-2 text-sm font-black text-primary">
            <ShoppingCart size={18} />
            {items.length} khóa học
          </div>
          <h1 className="text-4xl font-black tracking-tight">Giỏ hàng</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Kiểm tra khóa học trước khi thanh toán. Khóa đã đăng ký sẽ được giữ lại để đối chiếu nhưng không tính vào tổng tiền.
          </p>
        </div>
        <Link className="inline-flex h-11 items-center justify-center rounded-lg border border-primary px-5 text-sm font-black text-primary hover:bg-primary hover:text-white" href="/courses">
          Thêm khóa học
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-pink-100 bg-white p-10 text-center shadow-sm">
          <ShoppingCart className="mx-auto text-primary" size={58} />
          <h2 className="mt-5 text-2xl font-black">Giỏ hàng đang trống</h2>
          <p className="mt-2 text-muted">Chọn khóa học phù hợp để lưu lại và thanh toán sau.</p>
          <Link className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-black text-white" href="/courses">
            Xem khóa học
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {items.map((item) => {
              const isEnrolled = enrolledCourseIds.has(item.id);

              return (
                <article className="grid gap-4 rounded-xl border border-pink-100 bg-white p-4 shadow-sm md:grid-cols-[180px_1fr_auto]" key={item.id}>
                  <div
                    className="h-36 rounded-lg bg-cover bg-center md:h-full"
                    style={{
                      backgroundImage: `url(${item.image_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700"})`,
                    }}
                  />
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {isEnrolled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                          <CheckCircle2 size={14} />
                          Đã đăng ký
                        </span>
                      ) : null}
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-black text-primary">
                        {formatBaseAsTest(item.price)}
                      </span>
                    </div>
                    <h2 className="text-xl font-black">{item.course_name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{item.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-muted">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={16} /> {item.duration_weeks} tuần
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Users size={16} /> {item.current_students}/{item.max_students} học viên
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:w-36">
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-black text-white hover:opacity-90"
                      href={isEnrolled ? "/my-courses" : `/courses/${item.id}`}
                    >
                      {isEnrolled ? "Xem lớp" : "Thanh toán"}
                    </Link>
                    <form action={removeCartItem}>
                      <input name="course_id" type="hidden" value={item.id} />
                      <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-100 text-sm font-black text-red-600 hover:bg-red-50" type="submit">
                        <Trash2 size={15} />
                        Xóa
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-xl border border-pink-100 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-black">Tổng thanh toán</h2>
            <div className="mt-5 space-y-3 text-sm font-bold text-muted">
              <div className="flex justify-between">
                <span>Khóa trong giỏ</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Chờ thanh toán</span>
                <span>{payableItems.length}</span>
              </div>
              <div className="border-t border-pink-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Tổng cộng</span>
                  <span className="text-2xl font-black text-primary">{formatTestAmount(total)}</span>
                </div>
              </div>
            </div>
            {payableItems[0] ? (
              <Link className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-black text-white" href={`/courses/${payableItems[0].id}`}>
                Thanh toán khóa đầu tiên
              </Link>
            ) : (
              <Link className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-black text-white" href="/my-courses">
                Xem khóa học của tôi
              </Link>
            )}
            <form action={clearCart}>
              <button className="mt-3 h-11 w-full rounded-lg border border-primary bg-white text-sm font-black text-primary hover:bg-primary-soft" type="submit">
                Xóa toàn bộ giỏ hàng
              </button>
            </form>
          </aside>
        </div>
      )}
    </section>
  );
}
