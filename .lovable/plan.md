
## Goal

Enrich the order cards on `/carpenter-dashboard` with the fields the carpenter needs, plus a count badge on the "قيد الانتظار" tab. Keep all financial data strictly out of both the query and the UI.

## Changes (single file: `src/routes/carpenter-dashboard.tsx`)

### 1. Extend the Supabase query (non-financial fields only)

Add to the existing `select` (initial fetch + both realtime re-fetches):
- `shipping_notes`

Excluded and to remain excluded: `subtotal`, `shipping_fee`, `total`, `upfront_amount`, `remaining_amount`, `payment_method`, `instapay_reference`, `payment_proof_url`, `internal_notes`, `customer_email`, `customer_phone`, `shipping_address`.

Add a short code comment above the `select` listing forbidden columns so future edits don't accidentally pull financials.

### 2. Update the `Order` type

Add `shipping_notes: string | null`.

### 3. Order card UI (RTL, in this order)

1. **اسم العميل** — kept as-is at the top.
2. **الطلب / المواصفات** — keep the items list; expand the per-item meta line to always render, when present: `المقاس`, `التشطيب/اللون`, `مقاس مخصص (عرض × طول سم)`, `النقش`, `الكمية` (already there). No price columns.
3. **ملاحظات** — render `shipping_notes` in a soft highlighted block (amber-tinted) only when non-empty, labeled "ملاحظات".
4. **تاريخ الطلب** — kept, Arabic formatting.
5. **عدد الأيام منذ الطلب** — compute `floor((now − created_at) / 1 day)` and render a pill with urgency color:
   - 0 → "اليوم" (neutral)
   - 1 → "منذ يوم"
   - 2 → "منذ يومين"
   - 3–10 → "منذ N أيام" (amber from day 3)
   - >10 → "منذ N يوماً" (red from day 7)
   Color tiers: 0–2 neutral, 3–6 amber, ≥7 red ("عاجل").
6. Existing primary action button (ابدأ العمل / تم الانتهاء) stays at the bottom.

### 4. Pending tab notification badge

The tabs row already shows total counts per tab. Add an additional **red dot + number** badge on the "قيد الانتظار" tab fed by the existing `badge` state (incremented in the realtime listener when an order becomes `confirmed`). Today `badge` only renders on the bell icon — mirror it onto the tab so it's visible even when the bell scrolls offscreen. Clearing rules unchanged: tapping the bell OR switching to the "قيد الانتظار" tab resets `badge` to 0.

### 5. Guardrails

- No schema or RLS changes — RLS already permits the carpenter role to read these columns.
- PIN gate, realtime listener, sound alert, and status-advance flow unchanged.
- No new dependencies; reuse existing tokens, spacing, and Cairo font.
