## Goal
Owner notification emails should fire for all three submission types: orders ✅, session bookings, and custom build requests. Currently only orders trigger an email.

## Findings
- `notifyOwnerNewOrder` is wired into `src/routes/checkout.tsx` — works.
- `notifyOwnerNewBooking` exists and is wired into `src/routes/book.tsx`, but the published build at the time of the user's tests was old. Functionally the wiring is correct.
- `src/components/site/CustomBuildForm.tsx` has **no notification call at all** — that's why custom build submissions never email the owner.

## Changes

### 1. Add a new owner-notification server function: `notifyOwnerNewCustomBuild`
In `src/lib/owner-notifications.functions.ts`, add a third `createServerFn`:
- Input (zod): `full_name`, `email`, `phone`, `room_type`, `description`, optional `inspiration_image_url`
- Subject: `🛠️ New Custom Build Request — {full_name}`
- HTML body: customer info, room type, description, inline preview of inspiration image if provided, link to `https://suzywoodofficial.com/admin/custom-builds`
- Sends via the existing `sendViaResend` helper to `Youssef.esmat2004@gmail.com`

### 2. Wire it into `CustomBuildForm`
- Import `useServerFn` from `@tanstack/react-start` and `notifyOwnerNewCustomBuild`
- After the successful `custom_build_requests` insert, fire-and-forget `notifyOwner({ data: {...} })` (same non-blocking pattern as bookings/checkout)

### 3. Verify booking flow
- Re-confirm `src/routes/book.tsx` calls `notifyOwnerNewBooking` after insert. No code change needed — the issue was that the previously deployed build predated the wiring. Once republished, bookings will email.

## After implementing
User must **publish the app** for the new server functions to be live, then test one booking and one custom build submission.

## Files touched
- `src/lib/owner-notifications.functions.ts` (add one export)
- `src/components/site/CustomBuildForm.tsx` (import + one call)
