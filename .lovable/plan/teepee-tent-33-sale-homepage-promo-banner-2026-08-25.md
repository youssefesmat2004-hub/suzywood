# Teepee Tent 33% Sale + Homepage Promo Banner

## Goal
Run a temporary 33% sale on **The Teepee Tent** (EGP 3,750 → EGP 2,500) and make it the first thing visitors see via a top announcement bar.

## What will change

### 1. Sale-price support in the database
- Add `sale_price` (numeric, nullable) and `sale_ends_at` (timestamptz, nullable) to `public.products` and `public.product_variants`.
- Apply `GRANT` privileges on the columns and include the new columns in existing RLS policies.
- Seed the sale: set `sale_price = 2500` on the teepee tent product and all its active variants; leave `sale_ends_at` null so it runs until manually removed.

### 2. Type definitions
- Extend `Product` and the variant type in `src/lib/types.ts` to include `sale_price` and `sale_ends_at`.

### 3. Product cards and product page
- Update `src/components/site/ProductCard.tsx`:
  - Detect an active sale (`sale_price` set and `sale_ends_at` in the future or null).
  - Show a red/orange **SALE** badge.
  - Display the original price struck through and the sale price prominently.
  - Use `sale_price` for the "From" line and quick-add cart action.
- Update `src/routes/shop.$slug.tsx`:
  - Show struck-through original price + sale price.
  - Add a **SALE** badge near the product title.
  - Pass the sale price into the cart when the customer selects a variant.

### 4. Cart / checkout
- Ensure cart item prices and checkout totals use the active sale price when applicable.
- Update manual WhatsApp order form (`src/components/admin/ManualOrderModal.tsx`) so staff see and use the sale price for the teepee tent.

### 5. Homepage announcement bar
- Replace the current generic "Handcrafted with love in Cairo, Egypt" text in `src/components/site/AnnouncementBar.tsx` with a clickable teepee-tent promo strip:
  - Copy: "Limited-time offer: Teepee Tent now EGP 2,500 — was EGP 3,750 (33% off)"
  - Link directly to `/shop/teepetent`.
  - Add a small countdown/urgency visual (e.g., pulsing dot) without a hard deadline since `sale_ends_at` is open-ended.

### 6. Admin product form
- Add **Sale Price** and **Sale Ends At** inputs to `src/components/admin/ProductForm.tsx` so the team can create or remove future sales without SQL.

## Out of scope
- No sitewide promo-code changes; the existing checkout promo-code system remains separate.
- No email automation changes for the sale.

## Verification
- Open the homepage and confirm the announcement bar links to the teepee tent.
- Open `/shop/teepetent` and confirm the product shows EGP 2,500 with EGP 3,750 struck through and a SALE badge.
- Add the teepee tent to the cart and confirm the cart uses EGP 2,500.
- Check the `/shop` collection page and confirm the teepee tent card reflects the sale.
