"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Product } from "./api";
import { api } from "./api";

export interface CartLine {
  product: Product;
  qty: number;
}

export interface ShopGroup {
  shopId: string;
  shopName: string;
  lines: CartLine[];
  subtotal: number;
}

interface CartCtx {
  lines: CartLine[];
  groups: ShopGroup[];
  count: number;
  subtotal: number;
  coupon: { code: string; percent: number } | null;
  discount: number;
  add: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
}

const Ctx = createContext<CartCtx>(null as unknown as CartCtx);
export const useCart = () => useContext(Ctx);

const KEY = "cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [coupon, setCoupon] = useState<CartCtx["coupon"]>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setLines(saved.lines || []);
        setCoupon(saved.coupon || null);
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ lines, coupon }));
    } catch {}
  }, [lines, coupon, ready]);

  const add = useCallback((product: Product, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.product.id === product.id);
      if (found) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, product, qty: Math.min(product.stock, l.qty + qty) } : l
        );
      }
      return [...prev, { product, qty: Math.min(product.stock, qty) }];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.product.id === id ? { ...l, qty: Math.max(1, Math.min(l.product.stock, qty)) } : l))
    );
  }, []);

  const remove = useCallback((id: string) => setLines((prev) => prev.filter((l) => l.product.id !== id)), []);
  const clear = useCallback(() => {
    setLines([]);
    setCoupon(null);
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const c = await api<{ code: string; percent: number }>("/orders/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    setCoupon(c);
  }, []);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.product.price * l.qty, 0), [lines]);

  // Orders are split per shop; the coupon % is applied to each shop's subtotal (rounded down per shop),
  // exactly like the server does.
  const groups = useMemo(() => {
    const map = new Map<string, ShopGroup>();
    for (const l of lines) {
      const key = l.product.shopId || l.product.shop?.id || "unknown";
      const g = map.get(key) ?? { shopId: key, shopName: l.product.shop?.name || "ຮ້ານຄ້າ", lines: [], subtotal: 0 };
      g.lines.push(l);
      g.subtotal += l.product.price * l.qty;
      map.set(key, g);
    }
    return [...map.values()];
  }, [lines]);
  const discount = coupon ? groups.reduce((s, g) => s + Math.floor((g.subtotal * coupon.percent) / 100), 0) : 0;
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <Ctx.Provider
      value={{ lines, groups, count, subtotal, coupon, discount, add, setQty, remove, clear, applyCoupon, removeCoupon: () => setCoupon(null) }}
    >
      {children}
    </Ctx.Provider>
  );
}
