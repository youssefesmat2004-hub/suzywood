## Goal
Replace the flat 1000 EGP delivery fee with a dynamic fee based on delivery area + order size (small vs. big).

## Order size rule
- **Small order**: every line item belongs to one of these categories — `swings`, `play-safety` (Teepee Tents), `learning-tower`.
- **Big order**: anything else (or a mix).

Computed on the client from cart items (each CartItem already has `slug`; we'll add `categorySlug` so we can detect small vs. big without an extra query) and re-validated server-side inside `create_order_with_items` from `products.category_id` → `categories.slug`.

## Delivery fee table (single source of truth)
A constant map in `src/lib/delivery.ts`:

```text
AREA              SMALL    BIG
maadi             300      500
zamalek           500      700
dokki             500      700
masr-al-gedida    500      700
nasr-city         500      700
new-cairo         700      1000
shorouk-madinty   700      1200
obour             800      1500
sheikh-zayed      700      1000
other             0 (TBD)  0 (TBD)
```

Exports: `DELIVERY_AREAS` (value + label), `getDeliveryFee(areaKey, sizeType)`, `isSmallOrder(items)`.

## Database (SQL only, per request)
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_area TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_size_type TEXT DEFAULT 'big';
```
Plus update `create_order_with_items` RPC to:
- accept `_delivery_area` and `_order_size_type` params,
- recompute `shipping_fee` server-side from the same table (so the client can't fake it),
- store `delivery_area`, `order_size_type`,
- if area = `other`, set `shipping_fee = 0` and prepend "Delivery fee TBD — confirm via WhatsApp" to `notes`.

## Frontend changes

### `src/lib/cart.tsx`
Add `categorySlug: string` to `CartItem` so order-size detection works without a DB roundtrip.

### `src/routes/shop.$slug.tsx`
When adding to cart, include `categorySlug` (already loaded with the product).

### `src/routes/checkout.tsx`
- Remove the `SHIPPING = 1000` constant.
- Add `deliveryArea` state (default empty, must be selected).
- Replace the free-text **Governorate** input with an **Area** `<Select>` populated from `DELIVERY_AREAS`. Keep the **City / Area** text input as a more specific address line (or rename to "Neighborhood / Street details").
- Compute `sizeType = isSmallOrder(items) ? 'small' : 'big'` and `shipping = getDeliveryFee(deliveryArea, sizeType)`.
- If `deliveryArea === 'other'`: show an amber notice "Delivery fee will be confirmed via WhatsApp after order is placed" and treat fee as 0 for totals; disable the upfront amount line's fee math accordingly.
- Block "Continue to payment" until an area is chosen.
- Order summary shows: Subtotal, Promo (if any), `Delivery — {AreaLabel} ({sizeType})` or `Delivery — TBD`, Total.
- Pass `_delivery_area` and `_order_size_type` to `create_order_with_items`.

### `src/routes/cart.tsx`
No structural change; optional small-order badge (skip unless trivial).

### `src/routes/admin.orders.$id.tsx`
- Add `delivery_area`, `order_size_type` to the `select` and `Order` type.
- In the Shipping address card, show `Area: {label} · {sizeType} order`.
- In the totals card, replace the static "Delivery fee" line with editable input when `delivery_area === 'other'` (admin can set the real fee, which updates `shipping_fee`, `total`, and `remaining_amount` via a single update).

### `src/components/carpenter/CarpenterDashboard.tsx`
- Add `delivery_area` to `ORDER_SELECT` (non-financial, safe).
- Render an area chip on each order card.

## Files touched
- `supabase/migrations/<new>.sql` — columns + RPC update
- `src/lib/delivery.ts` (new)
- `src/lib/cart.tsx`
- `src/routes/shop.$slug.tsx`
- `src/routes/checkout.tsx`
- `src/routes/admin.orders.$id.tsx`
- `src/components/carpenter/CarpenterDashboard.tsx`
- `src/integrations/supabase/types.ts` (auto-regenerated after migration)

## Open questions
1. For the "Other" area flow, should the order still be placed normally (status `pending_payment`, upfront 75% calculated on subtotal only) and the delivery fee added later by admin? Default plan: **yes**.
2. Keep the existing free-text **City** and **Governorate** inputs, or replace **Governorate** with the Area dropdown and keep **City** as a neighborhood detail field? Default plan: **replace Governorate with Area dropdown; keep City as neighborhood/street details**.
