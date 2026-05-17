"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingCart, Trash2, X } from "lucide-react";
import type { CartItem } from "@/components/cart/add-to-cart-button";
import { baseAmountToTest, formatBaseAsTest, formatTestAmount } from "@/lib/currency";
import { clearCartAction, clearCartItemAction, syncCartItemsAction } from "@/lib/cart/actions";

const CART_KEY = "gymheart_cart";
const CART_EVENT = "gymheart-cart-changed";

function normalizeCartItem(value: unknown): CartItem | null {
  if (typeof value === "string") return null;
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
    const items = parsed.map(normalizeCartItem).filter(Boolean) as CartItem[];

    if (items.length !== parsed.length) {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    }

    return items;
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

function mergeCartItems(...groups: CartItem[][]) {
  const merged = new Map<string, CartItem>();
  groups.flat().forEach((item) => {
    if (!merged.has(item.id)) merged.set(item.id, item);
  });
  return [...merged.values()];
}

export function CartButton({
  initialItems,
  isAuthenticated = false,
}: {
  initialItems?: CartItem[];
  isAuthenticated?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>(initialItems ?? []);
  const didMergeRef = useRef(false);
  const didServerSyncRef = useRef(false);

  useEffect(() => {
    const sync = () => {
      setItems(readCart());
    };

    if (initialItems && !didMergeRef.current) {
      didMergeRef.current = true;
      const localItems = readCart();
      const mergedItems = mergeCartItems(initialItems, localItems);
      writeCart(mergedItems);
      setItems(mergedItems);

      const serverIds = new Set(initialItems.map((item) => item.id));
      const hasLocalOnlyItems = localItems.some((item) => !serverIds.has(item.id));
      if (hasLocalOnlyItems) {
        syncCartItemsAction(mergedItems.map((item) => item.id))
          .then((result) => {
            if (result.ok && result.items.length > 0) {
              writeCart(result.items);
              setItems(result.items);
            }
          })
          .catch(() => {
            // Keep local cart usable even if server sync is temporarily unavailable.
          });
      }
    } else {
      const localItems = readCart();
      setItems(localItems);

      if (isAuthenticated && !didServerSyncRef.current) {
        didServerSyncRef.current = true;
        syncCartItemsAction(localItems.map((item) => item.id))
          .then((result) => {
            if (!result.ok) return;
            const mergedItems = mergeCartItems(result.items, readCart());
            writeCart(mergedItems);
            setItems(mergedItems);
          })
          .catch(() => {
            // Keep local cart usable even if server sync is temporarily unavailable.
          });
      }
    }
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [initialItems, isAuthenticated]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const total = items.reduce((sum, item) => sum + baseAmountToTest(item.price), 0);

  async function removeItem(courseId: string) {
    writeCart(items.filter((course) => course.id !== courseId));
    await clearCartItemAction(courseId);
  }

  async function clearAll() {
    writeCart([]);
    await clearCartAction();
  }

  const drawer = open
    ? createPortal(
        <div className="fixed inset-0 z-[100]">
          <button
            aria-label="Đóng giỏ hàng"
            className="absolute inset-0 bg-black/55"
            onClick={() => setOpen(false)}
            type="button"
          />

          <aside className="absolute right-0 top-0 flex h-dvh w-full max-w-[520px] flex-col bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-pink-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <ShoppingCart className="text-primary" size={28} />
                <div>
                  <h2 className="text-2xl font-black">Giỏ hàng của bạn</h2>
                  <p className="mt-1 text-sm font-bold text-muted">
                    {items.length} khóa học trong giỏ
                  </p>
                </div>
              </div>
              <button
                aria-label="Đóng"
                className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-primary-soft hover:text-primary"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item) => (
                    <article className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm" key={item.id}>
                      <div className="flex gap-4">
                        <div
                          className="h-24 w-28 shrink-0 rounded-xl bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${item.image_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500"})`,
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 font-black">{item.course_name}</h3>
                          <p className="mt-2 text-sm font-bold text-muted">
                            {item.duration_weeks} tuần · {item.current_students}/{item.max_students} học viên
                          </p>
                          <p className="mt-2 text-lg font-black text-primary">
                            {formatBaseAsTest(item.price)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                        <Link
                          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-black text-white"
                          href={`/courses/${item.id}`}
                          onClick={() => setOpen(false)}
                        >
                          Thanh toán
                        </Link>
                        <button
                          className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-50 px-4 text-sm font-black text-red-600 hover:bg-red-100"
                          onClick={() => removeItem(item.id)}
                          type="button"
                        >
                          <Trash2 size={15} />
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-full flex-col items-center justify-center px-5 py-12 text-center">
                  <ShoppingCart className="mb-4 text-primary" size={58} />
                  <p className="text-xl font-black">Giỏ hàng đang trống</p>
                  <p className="mt-2 text-muted">Thêm khóa học để thanh toán sau.</p>
                  <Link
                    className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-black text-white"
                    href="/courses"
                    onClick={() => setOpen(false)}
                  >
                    Xem khóa học
                  </Link>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-pink-100 bg-primary-soft p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-black">Tổng cộng:</span>
                <span className="text-2xl font-black text-primary">
                  {formatTestAmount(total)}
                </span>
              </div>
              <Link
                className="mb-3 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary font-black text-white hover:opacity-90"
                href="/cart"
                onClick={() => setOpen(false)}
              >
                Xem giỏ hàng
              </Link>
              <button
                className="h-11 w-full rounded-lg border border-primary bg-white font-black text-primary hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={items.length === 0}
                onClick={clearAll}
                type="button"
              >
                {items.length === 0 ? "Chưa có khóa học trong giỏ" : "Xóa tất cả"}
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        aria-label="Giỏ hàng"
        className="relative inline-flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary"
        onClick={() => setOpen(true)}
        type="button"
      >
        <ShoppingCart size={18} />
        {items.length > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-black text-white">
            {items.length}
          </span>
        ) : null}
      </button>
      {drawer}
    </>
  );
}
