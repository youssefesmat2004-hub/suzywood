# Phase 2 — Admin Operations & CRM

Build the five admin features so you can run day-to-day operations without touching the database.

## 1. Contact Messages Admin (`/admin/messages`)

- Migration: add `is_read boolean default false` to `contact_messages` + admin UPDATE policy.
- New page lists messages newest-first with unread badge, full message preview, and one-click WhatsApp / email / phone reply buttons.
- Mark as read/unread toggle; realtime subscription so new messages appear instantly.
- Sidebar entry with unread count.

## 2. Custom Build Requests Admin (`/admin/custom-builds`)

- Uses existing `custom_build_requests` table (already has admin UPDATE policy).
- Table view with: name, phone, room type, description, status dropdown (new → contacted → accepted → declined → completed).
- WhatsApp customer button + copy-to-clipboard for description.
- Sidebar entry with "new" count badge.

## 3. Customers CRM (`/admin/customers`)

- Server function `getCustomers` (admin-only, uses `supabaseAdmin`) that aggregates from `orders` + `profiles`:
  - name, email, phone, total orders, total spent, last order date, has account (y/n).
- Searchable/sortable table; click a row to see that customer's full order history in a drawer.
- Export CSV button.

## 4. Sales Analytics (`/admin/analytics`)

- Add `recharts` dependency.
- Server function aggregating last 30/90/365 days:
  - Revenue line chart (daily)
  - Orders by status (donut)
  - Top 5 products by revenue (bar)
  - Bookings funnel (new → contacted → scheduled → completed)
  - KPI cards: total revenue, AOV, orders, conversion (orders / bookings)
- Date-range toggle (30 / 90 / 365 days).

## 5. Low-Stock Alerts

- New server function `getLowStock(threshold=3)` returning products + variants below threshold.
- Banner at top of `/admin` dashboard listing low/out-of-stock items with quick links.
- Red highlight rows in `/admin/products` when stock ≤ threshold; "Out of stock" pill when 0.
- Sidebar dashboard badge showing the count.

## Technical notes (for reference)

- All data fetching via `createServerFn` with `requireSupabaseAuth` + admin role check; `supabaseAdmin` used only where aggregation needs to bypass per-user RLS (CRM, analytics).
- Reuse existing `AdminLayout` sidebar; add 4 new entries with lucide icons (MessageSquare, Hammer, Users, BarChart3).
- Charts: `recharts` (lightweight, already common in shadcn stacks).
- Realtime for messages via Supabase channel on `contact_messages` table (enable in publication).

## Files to be created (~9)

- `supabase/migrations/<ts>_phase_2.sql`
- `src/routes/admin.messages.tsx`
- `src/routes/admin.custom-builds.tsx`
- `src/routes/admin.customers.tsx`
- `src/routes/admin.analytics.tsx`
- `src/lib/admin.functions.ts` (customers, analytics, low-stock aggregations)
- `src/components/admin/LowStockBanner.tsx`

## Files to be edited (~3)

- `src/components/admin/AdminLayout.tsx` — 4 new sidebar links + unread/low-stock badges
- `src/routes/admin.index.tsx` — embed LowStockBanner + quick KPI tiles
- `src/routes/admin.products.tsx` — red rows for low stock

Approve and I'll build it.