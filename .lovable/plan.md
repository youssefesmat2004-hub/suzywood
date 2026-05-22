# Sizes & Pricing Manager + Custom Size Feature

A big, cross-cutting change. Here's the plan before I build it.

## 1. Database (one migration)

New table `category_sizes` — the source of truth for standard sizes per category:
- `category_id` (fk)
- `label` (e.g. "120 x 60 cm")
- `price` (numeric, EGP) — default price for any new product in this category
- `sort_order`
- `is_active` (toggle hide/show)

New columns on `categories`:
- `custom_size_enabled` (bool, default false)
- `custom_size_surcharge` (numeric, default 0) — per-category surcharge
- `custom_size_note` (text) — e.g. "Our carpenter will build this to your exact measurements"

New columns on `order_items`:
- `custom_width_cm` (numeric, nullable)
- `custom_length_cm` (numeric, nullable)
- `custom_surcharge` (numeric, nullable)

RLS: public read on `category_sizes` where `is_active`, admin manage. (Carpenter already has read on order_items.)

I'll keep `product_variants` as-is (it stores per-product stock per size). The category sizes act as the *catalog* of allowed sizes; per-product stock still lives in `product_variants` keyed by label.

## 2. Admin

**Edit Category dialog** (`admin.categories.tsx`) — add tabs:
- **Details** (existing)
- **Sizes & Pricing** — list of sizes with drag-reorder, inline edit label/price, toggle active, delete, add new
- **Custom Size** — toggle enabled, surcharge input, note textarea

**ProductForm.tsx** — replace the hardcoded `CATEGORY_SIZE_PRESETS` lookup with a live fetch of `category_sizes` for the selected category. When creating a new product, auto-create variants from those sizes with the category's default price (admin can still override per-product price/stock).

Delete `src/lib/category-presets.ts` (no longer needed).

## 3. Product page (`shop.$slug.tsx`)

- Render standard size buttons from product variants (already done)
- If category has `custom_size_enabled`, render a "Custom Size — +X EGP" button below
- When selected: show Width / Length inputs + the category's note
- Price = product.starting_price + custom_surcharge
- Add to cart with `customSize: { widthCm, lengthCm, surcharge }`

## 4. Cart / Checkout

`cart.tsx` context: extend cart item shape with optional `customSize`. Display "Custom size: W x L cm (+200 EGP)" under the product name. Include surcharge in line total.

`checkout.tsx`: pass custom-size fields into `order_items` insert (`custom_width_cm`, `custom_length_cm`, `custom_surcharge`, and append to `size` text like "Custom: 110 x 55 cm").

## 5. Order views

- `admin.orders.$id.tsx`: show custom dimensions next to size when present
- Carpenter view: same line-item rendering, so the dimensions flow through automatically
- Order confirmation email (`order-emails.functions.ts`): include custom dimensions in the items list

## 6. Out-of-stock rule

Standard size buttons remain greyed out when variant stock = 0 (already implemented). Custom size button is always enabled when category has it on.

---

## Technical notes

- One DB migration covers all schema changes — I'll need your approval on it first.
- `category_sizes` becomes the single source of truth; the in-code presets file is removed.
- Custom-size data piggybacks on existing `order_items` rows (no new join table) so admin/carpenter views need only small additions.
- I'll keep the changes scoped — no redesign of the product page or cart, just additive UI for the custom-size affordance.

Approve and I'll run the migration and implement everything in one pass.