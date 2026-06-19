## Goal
Add a Delivery Area dropdown and a manual Delivery Cost field to the "Add WhatsApp Order" modal. Recalculate the 75/25 deposit split off the new total (Product Price + Delivery Cost), show both in the summary, and persist them.

## Changes

### 1. Database (migration)
```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_area TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_cost NUMERIC DEFAULT 0;
```
(`delivery_area` may already exist from the public checkout flow — `IF NOT EXISTS` handles it. `delivery_cost` is new and stores the admin-entered fee for manual orders; we keep the existing `shipping_fee` untouched so the public checkout logic is unaffected.)

### 2. `src/lib/manual-orders.functions.ts`
- Extend the Zod schema with:
  - `delivery_area`: enum of the 10 options (`maadi`, `zamalek`, `dokki`, `masr-al-gedida`, `nasr-city`, `new-cairo`, `shorouk-madinty`, `obour`, `sheikh-zayed`, `other`).
  - `delivery_cost`: non-negative number, default 0.
- On insert, save `delivery_area`, `delivery_cost`, and also set `shipping_fee = delivery_cost` so existing admin views that read `shipping_fee` show the right number. `subtotal` stays as the product price; `total`/`total_amount` = product price + delivery cost (computed server-side from the inputs for safety).

### 3. `src/routes/admin.orders.index.tsx` — `ManualOrderModal`
- Rename "Total price" input to "Product price (EGP)" (form field `product_price`).
- Add "Delivery Area" `<select>` with the 10 options above (labels: Maadi, Zamalek, Dokki, Masr Al Gedida, Nasr City, New Cairo, Shorouk-Madinty, Obour, Sheikh Zayed, Other).
- Add "Delivery Cost (EGP)" numeric input, defaults to 0, admin-editable.
- Recompute total on any change to product price or delivery cost:
  - `total = productPrice + deliveryCost`
  - `upfront = round(total * 0.75)`
  - `remaining = round(total * 0.25)`
  - Deposit/remaining inputs remain manually overridable.
- Expand the summary block to show:
  - Product price
  - Delivery area (human label) + Delivery cost
  - Total
  - Deposit (75%) and Remaining (25%)
- Submit payload sends `product_price` (as `total` upstream is now derived), `delivery_area`, `delivery_cost`, plus the (possibly overridden) `upfront_amount` and `remaining_amount`.

### 4. Validation
- Require a delivery area selection.
- Delivery cost ≥ 0 (allow 0 for "Other" / TBD).

## Out of scope
- Public customer checkout (unchanged — still uses the existing shipping fee table).
- Editing delivery area/cost on existing orders (not requested).
