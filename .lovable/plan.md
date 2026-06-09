# Customer confirmation emails

## What already works (no change needed)

- **Order placed → customer email**: `sendCheckoutPendingEmail` is already fired from `checkout.tsx` after a successful order. The customer receives "Order received — Pending Payment" with the InstaPay reference, item list, and 75 / 25 split.
- **Payment confirmed → customer email**: `sendOrderStatusEmail` is already fired from `admin.orders.$id.tsx → updateStatus()` every time staff changes the order status. So when you flip an order to **Payment Confirmed**, the customer automatically gets the "Your payment is confirmed" email. Same for shipped / delivered / cancelled.

I'll verify both of those still fire end-to-end and that the email arrives at the customer's inbox (no silent failures in the existing fire-and-forget calls).

## What's missing — bookings have no customer confirmation

Neither booking table currently stores a customer email, so we can't email them yet:

- `bookings` (free guidance session): only `full_name`, `phone`, `contact_method`.
- `measurement_bookings` (safety-gate measurement): only `full_name`, `phone`, `area`, `address`.

## Changes

### 1. Database migration
Add an **optional** `customer_email TEXT NULL` column to both tables (no extra RLS rules — existing INSERT policies already allow nulls and any string; we'll add a length cap in the policy check).

- `bookings.customer_email TEXT NULL` (max 254 chars)
- `measurement_bookings.customer_email TEXT NULL` (max 254 chars)

### 2. Forms — collect email (optional)
- **`src/routes/book.tsx`** (free session): add an optional Email input under Phone. Include in `submitBooking` payload.
- **`src/routes/shop.$slug.tsx`** → `MeasurementBookingDialog`: add an optional Email input. Include in the `measurement_bookings` insert.
- **`src/lib/public-submissions.functions.ts`** → `submitBooking` validator: accept optional `customer_email` (Zod `.email().optional()`).

If the customer leaves it blank, we simply skip the customer email and only WhatsApp + owner-notify as today.

### 3. New customer-facing email server functions
In a new file `src/lib/booking-emails.functions.ts` (mirrors the `checkout-emails.functions.ts` pattern — Resend via Lovable gateway, atomic `customer_notification_sent_at` claim, 30-minute freshness window):

- `sendBookingConfirmationEmail({ bookingId })` — pulls `bookings`, sends "Your free session is booked" with chosen day/time slot, contact method, and a note that the team will reach out on WhatsApp/phone shortly.
- `sendMeasurementBookingConfirmationEmail({ bookingId })` — pulls `measurement_bookings`, sends "Measurement visit booked — <product>" with product, area, address, preferred day/time, and a note that we'll confirm the visit.

Both use the same Suzy Wood branded HTML template as the existing order emails for visual consistency.

### 4. DB migration also adds the claim columns
- `bookings.customer_notification_sent_at TIMESTAMPTZ NULL`
- `measurement_bookings.customer_notification_sent_at TIMESTAMPTZ NULL`

### 5. Wire the calls
Fire-and-forget after the existing owner notification, only when the customer provided an email:

- `src/routes/book.tsx` → after `submit(...)` success, if email was entered, call `sendBookingConfirmationEmail({ data: { bookingId: res.id } }).catch(console.error)`.
- `src/routes/shop.$slug.tsx` `MeasurementBookingDialog` → same, alongside `notifyOwnerMeasurement`.

## Out of scope
- Forcing email as required on booking forms (kept optional so phone-only customers can still book).
- Re-sending confirmations for past bookings.
- A "your visit is scheduled / completed" follow-up status email for bookings (only the initial confirmation).

## Technical notes
- Reuses the existing Resend connector + `LOVABLE_API_KEY` / `RESEND_API_KEY` gateway pattern.
- The atomic `customer_notification_sent_at IS NULL → set now()` claim guarantees one email per booking even if the client retries.
- Customer-email sends are wrapped in `.catch(console.error)` so a notify failure never blocks the success state.
