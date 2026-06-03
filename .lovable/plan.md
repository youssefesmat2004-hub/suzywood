## Goal
Carpenters currently see only text for each order line (product name, size, finish, etc.). They need to see the product picture so they know what to build at a glance.

## Why images don't appear today
`src/components/carpenter/CarpenterDashboard.tsx` selects `order_items(id, product_name, quantity, size, finish, engraving, custom_width_cm, custom_length_cm)` — no image column and no join to `products`. The order card renders the item list as text only (lines 510–534), so there's nothing to display.

Note: `order_items` itself has no image column; the image lives on `products.image_url`. The `products` table is publicly readable for active products (RLS: "Active products are public"), so the carpenter session can join it without any policy or GRANT change.

## Changes

1. `src/components/carpenter/CarpenterDashboard.tsx`
   - Extend `ORDER_SELECT` to embed the product image via the existing `product_id` FK:
     `order_items(..., products(image_url))`
   - Add `product` (or `image_url`) to the `OrderItem` type.
   - In `OrderCard`, render a small square thumbnail (e.g. 56×56, rounded, `object-cover`) to the right of each line item, using `resolveImage(it.products?.image_url)` from `@/lib/images` so both bundled seed paths and uploaded Supabase Storage URLs work.
   - Fallback: if no image resolves, show a neutral placeholder tile with a `Package` icon (already imported) instead of a broken image.

2. No backend, RLS, GRANT, or schema changes. No edits to `client.ts`, migrations, or other dashboards.

## Out of scope
- Pricing or any financial fields (carpenter view stays non-financial per existing comment at line 42).
- Admin / owner notification flow (unchanged).
- Variant-level images (`product_variants.image_url`) — current `order_items` doesn't store a variant id, so we use the product's main image. Can be revisited later if you start tracking variant per line.
