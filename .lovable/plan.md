# Custom Build Request — Status emails & admin actions

## What you'll see
- Each custom build card in the admin panel already shows a colored status pill (the status dropdown). I'll keep that and add an explicit **Accept** button next to it (and a **Reject** button for symmetry), so one click both updates status and triggers the email.
- When status moves to **Accepted** → customer gets a warm Suzy Wood-branded email confirming acceptance, recapping their request (room type, description, inspiration image if any), promising contact within 24 hours, with a WhatsApp CTA button.
- When status moves to **Rejected/Declined** → customer gets a polite email saying we can't fulfill the request right now, with a CTA to browse standard products.
- Emails are sent only once per status transition (tracked in DB) so toggling status back and forth won't spam the customer.

## Status values
The table already has a `status` column with values: `new`, `contacted`, `accepted`, `declined`, `completed`. I'll keep those (the request asked for Pending/Accepted/Rejected/Completed — I'll map `new` → "Pending" and `declined` → "Rejected" in the UI labels so no data migration is needed, and your existing requests keep working).

## Technical changes

**Migration**
- Add `accepted_email_sent_at timestamptz` and `rejected_email_sent_at timestamptz` to `custom_build_requests` (prevents duplicate sends).

**New server function** `src/lib/custom-build-emails.functions.ts`
- `sendCustomBuildStatusEmail({ requestId, kind: 'accepted' | 'rejected' })`
- Uses `requireSupabaseAuth` + admin role check (matching the pattern in `order-emails.functions.ts`).
- Loads the request via `supabaseAdmin`, checks the corresponding `*_sent_at` is null, renders the HTML, sends via Resend connector gateway, stamps `*_sent_at`.
- Two HTML templates styled to match the existing order email (cream `#f6f4ef` background, serif headings, rounded card, brand accent). Accepted template includes a green WhatsApp button linking to the store WhatsApp number; rejected template includes a CTA button to `/shop`.

**Admin UI** (`src/routes/admin.custom-builds.tsx`)
- Relabel statuses: `new`→"Pending", `declined`→"Rejected".
- Add prominent **Accept** (green) and **Reject** (outline) buttons on each card. Clicking calls `updateStatus(row, 'accepted'|'declined')` which, on success, also invokes the new server function.
- The status `<Select>` dropdown also triggers the email when changed to accepted/declined (same code path).
- Show a small "✓ Customer notified" line under the status pill when `accepted_email_sent_at` / `rejected_email_sent_at` is set.

## Out of scope
- No changes to the customer-facing custom build form.
- No changes to the existing owner notification email that fires when a request is first submitted.
