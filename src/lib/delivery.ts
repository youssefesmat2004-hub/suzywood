import type { CartItem } from "./cart";

export type DeliveryAreaKey =
  | "maadi"
  | "zamalek"
  | "dokki"
  | "masr-al-gedida"
  | "nasr-city"
  | "new-cairo"
  | "shorouk-madinty"
  | "obour"
  | "sheikh-zayed"
  | "other";

export type OrderSizeType = "small" | "big";

type Fees = { small: number; big: number };

export const DELIVERY_AREAS: { value: DeliveryAreaKey; label: string; fees: Fees }[] = [
  { value: "maadi",           label: "Maadi",                fees: { small: 300, big: 500 } },
  { value: "zamalek",         label: "Zamalek",              fees: { small: 500, big: 700 } },
  { value: "dokki",           label: "Dokki",                fees: { small: 500, big: 700 } },
  { value: "masr-al-gedida",  label: "Masr Al Gedida",       fees: { small: 500, big: 700 } },
  { value: "nasr-city",       label: "Nasr City",            fees: { small: 500, big: 700 } },
  { value: "new-cairo",       label: "New Cairo",            fees: { small: 700, big: 1000 } },
  { value: "shorouk-madinty", label: "Shorouk / Madinty",    fees: { small: 700, big: 1200 } },
  { value: "obour",           label: "Obour",                fees: { small: 800, big: 1500 } },
  { value: "sheikh-zayed",    label: "Sheikh Zayed",         fees: { small: 700, big: 1000 } },
  { value: "other",           label: "Other (contact via WhatsApp)", fees: { small: 0,   big: 0 } },
];

const SMALL_CATEGORY_SLUGS = new Set(["swings", "play-safety", "learning-tower"]);

export function isSmallOrder(items: Pick<CartItem, "categorySlug">[]): boolean {
  if (items.length === 0) return false;
  return items.every((i) => i.categorySlug ? SMALL_CATEGORY_SLUGS.has(i.categorySlug) : false);
}

export function getDeliveryFee(area: DeliveryAreaKey | "" | null | undefined, size: OrderSizeType): number {
  if (!area || area === "other") return 0;
  const row = DELIVERY_AREAS.find((a) => a.value === area);
  return row ? row.fees[size] : 0;
}

export function getAreaLabel(area: DeliveryAreaKey | "" | null | undefined): string {
  if (!area) return "";
  return DELIVERY_AREAS.find((a) => a.value === area)?.label ?? area;
}