"use client";

import { useEffect } from "react";
import type { CartItem } from "@/components/cart/add-to-cart-button";

const CART_KEY = "gymheart_cart";
const CART_EVENT = "gymheart-cart-changed";

export function CartLocalSync({ items }: { items: CartItem[] }) {
  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CART_EVENT));
  }, [items]);

  return null;
}
