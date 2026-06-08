## Goal

Make sure the owner gets an email for **every** customer action on the site. Today the system only emails for: new orders, free-session bookings, and custom build requests. Missing:

1. **Safety-gate measurement bookings** (the one the user just lost)
2. Contact form messages
3. Newsletter sign-ups
4. New product reviews

## Changes

### 1. `src/lib/owner-notifications.functions.ts`
Add four new server functions, mirroring the existing pattern (sends via Resend gateway, atomic `owner_notification_sent_at` claim, 10‑minute freshness window):

- `notifyOwnerNewMeasurementBooking({ bookingId })` — pulls from `measurement_bookings`. Email shows: product, customer name, phone, area, address, preferred day/time, notes, and a button to `/admin/measurement-bookings`. Subject: `📐 New Measurement Booking — <product>`.
- `notifyOwnerNewContactMessage({ messageId })` — pulls from `contact_messages`. Subject: `✉️ New Contact Message — <name>`. Links to `/admin/messages`.
- `notifyOwnerNewNewsletterSubscriber({ subscriberId })` — short email with the address. Subject: `📬 New Newsletter Subscriber`. Links to `/admin/newsletter`.
- `notifyOwnerNewReview({ reviewId })` — shows product, rating (stars), title, body, reviewer. Subject: `⭐ New Review — <rating>★ <product>`. Links to the product page + admin.

### 2. Database migration
Add `owner_notification_sent_at TIMESTAMPTZ NULL` to the four tables that don't have it yet:
- `measurement_bookings`
- `contact_messages`
- `newsletter_subscribers`
- `reviews`

(Used for the same atomic single-send claim already used by `orders` / `bookings` / `custom_build_requests`.)

### 3. Wire calls from the submission sites
Fire-and-forget call after a successful insert (same pattern as `book.tsx` already uses for `notifyOwnerNewBooking`):

- `src/routes/shop.$slug.tsx` → `MeasurementBookingDialog.submit`: change the insert to `.select("id").single()`, then call `notifyOwnerNewMeasurementBooking({ data: { bookingId: row.id } })`.
- `src/routes/contact.tsx` → contact form submit: capture inserted id, call `notifyOwnerNewContactMessage`.
- `src/components/site/NewsletterForm.tsx` → after successful insert, call `notifyOwnerNewNewsletterSubscriber`.
- `src/components/site/Reviews.tsx` → after the upsert, call `notifyOwnerNewReview` (skip if the row was an edit of an existing review — only notify when `created_at` matches the just-inserted moment, which we'll guard inside the server fn via the existing `recent()` helper).

### Out of scope
- Wishlist adds, cart adds, product views — those are not "actions" the owner needs to know about and would flood the inbox.
- Re-sending notifications for past measurement bookings that already exist in the DB.

## Technical notes

- Re-uses the existing Resend connector and `OWNER_EMAILS` / `FROM` constants.
- Atomic claim via `owner_notification_sent_at IS NULL` guarantees one email per submission even if the client retries.
- Server fn calls are wrapped in `.catch(console.error)` on the client so a notify failure never blocks the user's success state.
