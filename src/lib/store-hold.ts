// Temporary storefront controls while the owner updates product pricing.
// Price values stay untouched in the database and admin panel.
export const PUBLIC_PRICES_HIDDEN = true;

export const ALLOWED_ORDER_PRODUCT_SLUGS = [
  "teepetent",
  "tent-swing-bundle",
  "theswing",
  "therocker",
] as const;

const allowedSlugs: ReadonlySet<string> = new Set(ALLOWED_ORDER_PRODUCT_SLUGS);

export function isOrderingAllowed(slug: string | null | undefined): boolean {
  return !!slug && allowedSlugs.has(slug);
}

export function areAllItemsOrderable(items: ReadonlyArray<{ slug?: string | null }>): boolean {
  return items.length > 0 && items.every((item) => isOrderingAllowed(item.slug));
}
