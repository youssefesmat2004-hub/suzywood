## Carpenter Dashboard — `/carpenter-dashboard`

Mobile-first, Arabic RTL workshop dashboard with PIN gate, real-time order alerts, and status updates. No financial data anywhere.

### 1. Auth model (important — please read)

Your DB has RLS that requires a real Supabase user with the `carpenter` role to read `orders` or update `status`. A pure client-side PIN check can't satisfy that. To keep the UX you asked for (PIN only, no email/password), I'll do this:

- Create one shared workshop user (e.g. `workshop@suzywoodofficial.com`) and grant it the existing `carpenter` role in `user_roles`. Credentials stored as server secrets.
- New server function `verifyCarpenterPin({ pin })`:
  - Reads `CARPENTER_PIN` and `CARPENTER_EMAIL` / `CARPENTER_PASSWORD` from `process.env`.
  - If PIN matches, returns the credentials to the client.
- Client signs into Supabase with those credentials and stores the session in `localStorage` (Supabase already persists sessions). Realtime + RLS-protected reads/updates then "just work" as the carpenter role.
- PIN seeded to `1234` via secret; you change it later by updating the secret.

This means real Supabase Realtime works, the existing carpenter RLS + the `enforce_carpenter_order_update_scope` trigger (which already restricts carpenters to status-only edits) protect the data, and the PIN UX is preserved.

Secrets to add: `CARPENTER_PIN`, `CARPENTER_EMAIL`, `CARPENTER_PASSWORD`.

### 2. Status mapping

Your DB uses: `pending_payment | confirmed | in_production | shipped | delivered | cancelled`. I'll map the three Arabic tabs as:

- **قيد الانتظار** → `confirmed` (= "Payment Confirmed / ready for production")
- **جاري العمل** → `in_production`
- **تم الانتهاء** → `delivered` (shipped/cancelled are hidden from this dashboard)

Action buttons:
- Card in قيد الانتظار → button "ابدأ العمل" → updates status to `in_production`.
- Card in جاري العمل → button "تم الانتهاء" → updates status to `delivered`.
- Cards in تم الانتهاء are read-only.

### 3. Files

```text
src/routes/carpenter-dashboard.tsx        new public route, ssr:false
src/components/carpenter/PinGate.tsx       4-digit PIN UI (Arabic, RTL)
src/components/carpenter/OrderCard.tsx     name / items / date / action button
src/components/carpenter/NewOrderToast.tsx toast + bell badge state
src/lib/carpenter.functions.ts             verifyCarpenterPin server fn
public/sounds/new-order.mp3                short bell ping (~1s)
```

No edits to existing admin routes or schema beyond seeding the shared user + secrets.

### 4. UI / behavior

- Route is top-level, `ssr: false` (Supabase session lives in localStorage).
- `dir="rtl"`, Arabic UI via Tailwind utility `rtl:`, system Arabic font stack (`'Cairo', 'Tajawal', system-ui` — falls back gracefully without adding a font file).
- PIN screen: 4 large OTP-style boxes, numeric keypad-friendly (`inputMode="numeric"`). On success, sign in + render dashboard.
- Top bar: title "لوحة الورشة", bell icon with red badge counter (count of new `confirmed` orders since dashboard opened or last viewed), tap clears.
- Sticky tab bar: قيد الانتظار / جاري العمل / تم الانتهاء with counts.
- Cards (one per order):
  - **اسم العميل** — `customer_name`
  - **الطلب** — list of `order_items.product_name × quantity` (size/finish/engraving shown small below each line — useful for the carpenter, no prices)
  - **تاريخ الطلب** — `created_at` formatted Arabic locale
  - **رقم الطلب** — `order_number` (small, monospace, helps reference)
  - Large action button at bottom (per status mapping above).
- Pull-to-refresh not needed; realtime + tab switching is enough.

### 5. Data

- Initial fetch: `orders` where status in (`confirmed`,`in_production`,`delivered`), ordered by `created_at desc`, joined with `order_items` (product_name, size, finish, engraving, quantity). **No** `total`, `subtotal`, `unit_price`, `shipping_fee`, `upfront_amount`, `remaining_amount`, `payment_*` columns selected — anywhere.
- Status updates: `supabase.from('orders').update({ status }).eq('id', id)` — RLS + trigger enforce carpenter scope.

### 6. Realtime alerts

- Subscribe to `postgres_changes` on `public.orders` `UPDATE` events.
- Trigger condition: `payload.new.status === 'confirmed'` AND (`payload.old.status !== 'confirmed'`). This catches an admin moving an order from `pending_payment` → `confirmed`.
- On trigger:
  - Insert the new order at the top of the قيد الانتظار list (or merge if already present).
  - Increment bell badge.
  - Play `new-order.mp3` (preloaded `<audio>`; first play unlocked by the PIN-submit tap so iOS Safari allows it).
  - Show sonner toast: **"لديك طلب جديد جاهز للعمل!"** + customer name, 6s.
- Also handle `INSERT` events that come in already as `confirmed` (rare, but covers edge case).
- Status changes made by the carpenter themselves also flow through the same subscription, so all open tabs/devices stay in sync.

### 7. Out of scope (call out before I build)

- No assignment of orders to specific carpenters.
- No build notes / photo uploads.
- No push notifications when the tab is closed (sound + toast only while page is open).
- No translation of product names — those show in whatever language they're stored as in `products.name`.

### Technical notes

- Migration: insert one row into `user_roles` for the shared workshop user once it's created in Supabase Auth. I'll do this as a single migration after you confirm the email to use (or I'll default to `workshop@suzywoodofficial.com`).
- `realtime` publication already includes `orders` if your existing admin orders page realtime works (it does — `admin.orders.index.tsx` uses the same channel). No publication changes needed.
- Sound file: I'll generate a short synthesized bell ping and commit it to `public/sounds/`.

### Open questions before I build

1. OK with the **shared carpenter Supabase user** approach above (only way to get true RLS-safe realtime behind a PIN)?
2. Email to use for that shared user — default `workshop@suzywoodofficial.com`?
3. Should **shipped** orders also appear under "تم الانتهاء", or only `delivered` as proposed?