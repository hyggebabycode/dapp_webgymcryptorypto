"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, ShoppingCart } from "lucide-react";
import { addCartItemAction } from "@/lib/cart/actions";

export type CartItem = {
  id: string;
  course_name: string;
  description: string | null;
  price: number;
  duration_weeks: number;
  max_students: number;
  current_students: number;
  image_url: string | null;
};

const CART_KEY = "gymheart_cart";
const CART_EVENT = "gymheart-cart-changed";

function normalizeCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CartItem>;
  if (!item.id || !item.course_name) return null;

  return {
    id: String(item.id),
    course_name: String(item.course_name),
    description: item.description ?? null,
    price: Number(item.price || 0),
    duration_weeks: Number(item.duration_weeks || 0),
    max_students: Number(item.max_students || 0),
    current_students: Number(item.current_students || 0),
    image_url: item.image_url ?? null,
  };
}

function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCartItem).filter(Boolean) as CartItem[];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function AddToCartButton({
  course,
  className,
}: {
  course: CartItem;
  className?: string;
}) {
  const [toast, setToast] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function showToast(text: string, type: "success" | "info" | "error" = "success") {
    setToast({ text, type });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(null), 2200);
  }

  return (
    <>
      <button
        className={
          className ||
          "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-primary px-3 text-sm font-black text-primary hover:bg-primary-soft"
        }
        onClick={async () => {
          const cart = readCart();
          if (cart.some((item) => item.id === course.id)) {
            showToast("Khóa học này đã có trong giỏ hàng.", "info");
            return;
          }

          try {
            const result = await addCartItemAction(course.id);
            writeCart([...cart, course]);
            showToast(
              result.ok
                ? "Đã thêm khóa học vào giỏ hàng."
                : "Đã lưu tạm khóa học. Đăng nhập để đồng bộ giỏ hàng.",
              result.ok ? "success" : "info",
            );
          } catch {
            showToast("Chưa đồng bộ được giỏ hàng. Vui lòng thử lại.", "error");
          }
        }}
        type="button"
      >
        <ShoppingCart size={15} />
        Thêm vào giỏ
      </button>

      {toast ? (
        <div className="fixed right-5 top-24 z-[120] flex max-w-sm items-center gap-3 rounded-2xl border border-pink-100 bg-white px-5 py-4 text-sm font-black text-[#1c0d11] shadow-2xl">
          {toast.type === "error" ? (
            <AlertCircle className="shrink-0 text-red-500" size={22} />
          ) : toast.type === "info" ? (
            <Info className="shrink-0 text-blue-500" size={22} />
          ) : (
            <CheckCircle2 className="shrink-0 text-primary" size={22} />
          )}
          <span>{toast.text}</span>
        </div>
      ) : null}
    </>
  );
}
