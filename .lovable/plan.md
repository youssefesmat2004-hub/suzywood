## Goal
Wherever a customer phone number appears in the admin panel, add a small green WhatsApp icon-button next to it. Clicking opens WhatsApp Web / app in a new tab, chatting with that number, with a context-aware prefilled message.

## Shared helper
Create `src/lib/whatsapp.ts`:
- `toWaNumber(phone)` — normalize Egyptian numbers: strip spaces/dashes/`+`, convert leading `0` → `20` (e.g. `01096313532` → `201096313532`).
- `waLink(phone, message)` — returns `https://wa.me/<num>?text=<encoded>`; returns `null` if phone missing/invalid.
- `<WhatsAppLink phone message title? />` React component: renders a green WhatsApp SVG icon button (same icon style as `WhatsAppWidget`), `target="_blank"`, `rel="noopener noreferrer"`, accessible `aria-label`, tooltip. Disabled/hidden if number invalid.

## Screens to update and prefilled messages

Each message starts with `Hi {first_name}, this is Suzy Wood —` and then:

- **Orders list** (`admin.orders.index.tsx`) and **order detail** (`admin.orders.$id.tsx`) — regular + manual WhatsApp orders: `regarding your order #{short_id}.`
- **Manual order modal** viewing existing order — same message.
- **Guidance bookings** (`admin.bookings.tsx`): `about your free guidance session ({preferred_day}, {time_slot}).`
- **Measurement bookings** (`admin.measurement-bookings.tsx`): `about your measurement booking.`
- **Custom build requests** (`admin.custom-builds.tsx`): `about your custom build request.`
- **Contact messages** (`admin.messages.tsx`): `regarding your message to us.`
- **Customers** (`admin.customers.tsx`): generic `just checking in.`

For each screen I'll read the file, find where the phone is rendered, and place `<WhatsAppLink phone={...} message={...} />` inline next to it. No layout overhaul — just an icon button beside the existing phone text.

## Non-goals
- No DB changes.
- No changes to customer-facing pages.
- No changes to email/notification logic.
- Numbers that are missing or malformed simply won't show the button.
