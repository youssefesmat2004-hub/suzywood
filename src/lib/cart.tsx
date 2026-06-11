import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  sizeLabel: string;
  finish: string;
  finishLabel: string;
  engraving: string;
  unitPrice: number;
  quantity: number;
  customSize?: {
    widthCm: number;
    lengthCm: number;
    surcharge: number;
  };
  bedRails?: boolean;
  bedRailsPrice?: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (idx: number) => void;
  setQuantity: (idx: number, q: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const Ctx = createContext<CartCtx | undefined>(undefined);
const KEY = "suzywood:cart:v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((item: CartItem) => {
    setItems((curr) => {
      const customKey = item.customSize
        ? `${item.customSize.widthCm}x${item.customSize.lengthCm}`
        : "";
      const bedRailsKey = item.bedRails ? "br" : "";
      const idx = curr.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.size === item.size &&
          i.finish === item.finish &&
          i.engraving === item.engraving &&
          (i.customSize ? `${i.customSize.widthCm}x${i.customSize.lengthCm}` : "") === customKey &&
          ((i.bedRails ? "br" : "") === bedRailsKey),
      );
      if (idx >= 0) {
        const next = [...curr];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...curr, item];
    });
  }, []);

  const remove = useCallback((idx: number) => setItems((c) => c.filter((_, i) => i !== idx)), []);
  const setQuantity = useCallback((idx: number, q: number) =>
    setItems((c) => c.map((it, i) => (i === idx ? { ...it, quantity: Math.max(1, q) } : it))), []);
  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return (
    <Ctx.Provider value={{ items, add, remove, setQuantity, clear, subtotal, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
