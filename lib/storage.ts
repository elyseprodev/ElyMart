import type { Product } from "@/lib/products";

export const STORAGE_KEYS = {
  products: "elymart_products_v1",
  cart: "elymart_cart_v1",
  wishlist: "elymart_wishlist_v1",
  orders: "elymart_orders_v1",
};

export type CartItem = { productId: string; quantity: number };

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("elymart:local-update", { detail: { key } }));
  } catch {
    // Storage can be unavailable in private browsing; the current page remains usable.
  }
}

export function readSellerProducts(): Product[] {
  return readLocal<Product[]>(STORAGE_KEYS.products, []);
}
