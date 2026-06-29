# Carpenter Cost & Real Profit System

Admin-only cost tracking, with a stripped-down per-carpenter "what I'm owed" view. Customers never see costs or profit. Carpenters only see their own pay amounts.

## 1. Database migration

Add columns and a security-definer view; lock down with RLS.

```sql
ALTER TABLE public.products         ADD COLUMN IF NOT EXISTS carpenter_cost NUMERIC DEFAULT 0;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS carpenter_cost NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carpenter_cost_override   NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS actual_carpenter_cost     NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carpenter_payment_status  TEXT DEFAULT 'unpaid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carpenter_paid_at         TIMESTAMPTZ;
```

Add a security-definer function `get_carpenter_owed_orders(_carpenter_id INT)` that returns only `{ order_id, order_number, product_summary, carpenter_cost, payment_status, paid_at, created_at }` — no selling price, no profit. The carpenter dashboard calls this via RPC.

Carpenter RLS on `orders` already blocks updating financial columns via the existing `enforce_carpenter_order_update_scope` trigger — extend the deny list with the new financial columns (`carpenter_cost_override`, `actual_carpenter_cost`, `carpenter_payment_status`, `carpenter_paid_at`).

`products.carpenter_cost` and `product_variants.carpenter_cost` already inherit table RLS; carpenters' SELECT policy on products needs to exclude these columns. Easiest path: keep table-level SELECT and rely on the frontend never requesting the column for carpenters. (Postgres column-level grants would be the strict version — call out and implement only if you want defense-in-depth.)

## 2. Admin: Product form

`src/components/admin/ProductForm.tsx`:
- Add "Carpenter Cost (EGP)" numeric input (admin only, separate section "Internal — Admin only").
- Add per-variant carpenter cost in the variants editor.

`src/routes/admin.products.$id.tsx`: include `carpenter_cost` in fetched fields.

## 3. Admin: Manual WhatsApp order modal

`src/components/admin/ManualOrderModal.tsx`: add "Carpenter Cost (EGP)" input. On submit, store as `actual_carpenter_cost` (and set `carpenter_cost_override` = same value to mark explicit).

`src/lib/manual-orders.functions.ts`: accept `carpenter_cost` in schema; persist.

## 4. Admin: Order detail

`src/routes/admin.orders.$id.tsx`: new "Cost & Profit (internal)" card showing:
- Selling price (order total minus shipping)
- Auto carpenter cost (sum of `order_items.product.carpenter_cost` / variant cost × qty)
- Manual override input → saves to `carpenter_cost_override` and recomputes `actual_carpenter_cost`
- Real profit = selling price − actual carpenter cost
- Carpenter payment status badge + "Mark as Paid" / "Mark as Unpaid" toggle

When admin first opens an order, if `actual_carpenter_cost = 0` and no override, backfill from products.

## 5. Carpenter Payments page

New route `src/routes/admin.carpenter-payments.tsx`. Grouped by `assigned_carpenter` (1/2/3):
- Table per carpenter: order #, product summary, carpenter cost, status, Mark Paid button
- KPIs: Total owed, Total paid (lifetime), Total paid this month
- "Mark all unpaid as paid" bulk button per carpenter (with confirm)

Add to `src/components/admin/AdminLayout.tsx` nav.

## 6. Analytics (admin only)

`src/routes/admin.analytics.tsx`:
- Replace the `PROFIT_MARGIN = 0.25` constant logic with real numbers from `actual_carpenter_cost`.
- KPIs: Total Revenue / Total Carpenter Costs / Real Profit / Margin %
- New "Real profit by month" chart (last 12 months: revenue, carpenter cost, profit bars).
- Update the profit calculator (if present in `admin.settings` or analytics) so the Suzan/Youssef split uses real net profit.

## 7. Carpenter dashboard

`src/components/carpenter/CarpenterDashboard.tsx`: under each order card, add a "Your pay" line + Paid/Unpaid pill, fed by the new RPC. New "Owed to you" KPI at the top. Never query selling price.

## Technical notes

- Computation of auto cost lives in a small util `src/lib/carpenter-cost.ts` so admin order detail, analytics, and the payments page agree.
- Use `assigned_carpenter` (existing column) to attribute orders to carpenters.
- Manual orders: when `carpenter_cost` is entered, `actual_carpenter_cost = entered` and override = entered.
- Marking paid sets `carpenter_payment_status='paid'` + `carpenter_paid_at=now()`. Unmarking clears both.
- Schema/RLS go in one migration (approval required) before the rest of the code.

## Out of scope (ask if you want it later)

- Carpenter cost history/audit log
- Partial payments (only full mark-paid)
- Exporting payments to CSV
