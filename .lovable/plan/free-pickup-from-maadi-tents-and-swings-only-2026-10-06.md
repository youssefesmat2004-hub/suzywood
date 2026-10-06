# Free pickup from Maadi (tents and swings only)

## What customers will see
- At checkout, a new choice in the delivery area list: **"Pickup from Maadi — Free"** (Arabic too).
- It only shows up when everything in the cart is a Teepee Tent or a Swing (including the Tent + Swing bundle). If the cart has anything else, the option is hidden.
- When picked, delivery is EGP 0. The order summary and payment notes say "Pickup from Maadi" where they used to say delivery. The 75% deposit stays the same, and the remaining 25% is paid at pickup.

## What you will see in admin
- The order shows the area as "Pickup from Maadi" with a delivery fee of 0, so you can spot pickup orders easily.
- Order emails show "Pickup from Maadi" with no delivery fee.

## Safety check
- When an order is placed, the system checks the cart again. If someone picks pickup but has items that aren't tents or swings, the order is blocked with a clear message. That way free pickup can't be used for other products.

## Technical details
- `src/lib/delivery.ts`: add `"pickup-maadi"` area (fees 0) and `isPickupEligible(items)` (every item's categorySlug is `play-safety` or `swings`).
- `src/routes/checkout.tsx`: show the option only when the cart qualifies, and clear it if the cart changes and no longer qualifies. Fee is 0 and the labels change to pickup wording.
- i18n checkout sections (en/ar): new strings.
- Migration: update both `create_order_with_items` overloads. Treat `pickup-maadi` as fee 0 with no "TBD" note, and raise an exception if any item's category isn't `play-safety` or `swings`.
- `order-emails.functions.ts` / admin order details: show the area label "Pickup from Maadi".
- Add the pickup option to the 5-day health check order tests.
