## Goal

Let customers optionally add a mattress when buying a crib. You set two prices in **Admin → Categories → Cribs** (small mattress, big mattress) and tag each crib size as "small" or "big" so the right mattress price is auto-applied.

## What the customer sees (on a Cribs product page)

- A new checkbox: **"Add mattress (+EGP X)"** — appears only for cribs.
- The price X updates live based on the size selected (small vs big).
- The cart line shows "+ Mattress", and total includes the mattress price.

## What you see in admin

**Categories → Cribs → edit:**
- Toggle: *Mattress add-on enabled*
- Number: *Small mattress price (EGP)*
- Number: *Big mattress price (EGP)*
- Note field (optional)

**Each size row** in the Cribs sizes list gets a new selector: `Mattress tier: [None / Small / Big]`.

## Technical changes

### 1. Database migration
- `categories`: add `mattress_addon_enabled bool default false`, `mattress_small_price numeric default 0`, `mattress_big_price numeric default 0`, `mattress_addon_note text`.
- `category_sizes`: add `mattress_tier text` (nullable, values: `small` | `big`).
- `order_items`: add `mattress bool default false`, `mattress_price numeric default 0`.
- Update `create_order_with_items` RPC to accept `mattress` per item, look up the matching mattress price from `category_sizes.mattress_tier` + category prices, validate, and store on the order_item + add to subtotal.

### 2. Frontend
- `src/routes/admin.categories.tsx`: add the 3 mattress fields to the form; add a `Mattress tier` select to each size row.
- `src/lib/cart.tsx`: add `mattress?: boolean` and `mattressPrice?: number` to `CartItem`; include in dedupe key.
- `src/routes/shop.$slug.tsx`: when category slug = `cribs` and `mattress_addon_enabled`, render the checkbox; compute price from the selected size's `mattress_tier`; include in `add()` payload and label.
- `src/routes/cart.tsx` + checkout summary: show "+ Mattress (EGP X)" line under the affected item.
- `src/lib/manual-orders.functions.ts`: accept mattress flag for parity with WhatsApp manual orders.

### 3. Types
After the migration runs, `src/integrations/supabase/types.ts` regenerates automatically; update local TS types in the affected files.

## Out of scope
- Per-product mattress pricing (you chose category-level).
- Multiple mattress models per crib.
