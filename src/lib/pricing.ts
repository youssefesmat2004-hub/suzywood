// Storewide discount applied once to product/variant base prices.
// Surcharges (custom size, engraving, ottoman, portable changing table) are NOT discounted.
export const DISCOUNT_RATE = 0.05;
export const DISCOUNT_LABEL = "5% OFF";

export function applyDiscount(price: number): number {
  if (!price || price <= 0) return price;
  return Math.round(price * (1 - DISCOUNT_RATE));
}

export function isDiscountable(price: number): boolean {
  return typeof price === "number" && price > 0;
}