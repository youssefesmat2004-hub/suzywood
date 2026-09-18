# Full customer-side testing sweep

Goal: actually submit every form a customer can use, as a guest and as a signed-in customer, confirm each one saves and shows the right message — not just measurement bookings.

## What gets tested

Each item is exercised end to end in a real browser session against the live preview, in both English and Arabic where the form is translated.

1. Newsletter signup (footer) — valid email, duplicate email, bad email
2. Contact form — full submission plus empty/invalid field handling
3. Book a visit form
4. Custom build request — including the inspiration photo upload
5. Measurement booking (re-verified alongside the rest)
6. Product page add-to-cart — every option combination: size, colour/finish, custom size, name engraving, mattress, ottoman, changing table, fairy lights, pompoms with the colour picker
7. Cart — quantity change, remove item, empty-cart state
8. Promo code entry at checkout — valid, invalid, expired
9. Checkout as a guest — full order with delivery area, payment proof upload, order confirmation page
10. Checkout while signed in
11. Order tracking page — real order number + phone, and a wrong combination
12. Product review submission (signed-in customer)
13. Wishlist add/remove
14. Account sign-up, sign-in, sign-out, Google sign-in, password reset request
15. WhatsApp contact buttons open with the right prefilled message

## What I check on each one

- The submission actually lands in the database (no blocked-by-security errors)
- The success or error message the customer sees is correct and translated
- No errors in the browser console
- Confirmation emails are triggered where expected
- The entry shows up in the matching admin screen

## Known risk to look for

Several guest forms still write to the database directly from the browser rather than through a validated server endpoint (contact, newsletter, and a few others). These are the same shape as the measurement-booking failure you just hit, so any that break get moved to a server endpoint the same way.

## Cleanup

Every test record I create is deleted afterwards, so your admin panel stays clean.

## Deliverable

A pass/fail list of all items above, with each failure fixed in the same pass and re-tested.
