## Goal

On the safety gate product, never allow add-to-cart. Show only images and a booking action — no price, no description/what's-included clutter. Replace "Price upon measurement" with "Custom Measurement Required" everywhere it appears for safety gates.

## Changes

### 1. `src/routes/shop.$slug.tsx` — `SafetyGateRightColumn`
- Remove the `Price upon measurement` line.
- Remove the `product.description` paragraph.
- Remove the "What's included" list block (250 EGP measurement visit, etc.).
- Remove the muted "This product requires custom measurements…" callout.
- Keep: the `Custom Measurement Required` pill, product name, tagline, the `Book your Measurement session now` button, and the WishlistButton.
- The existing `isSafetyGate` branch already prevents the regular add-to-cart UI from rendering — confirm no other code path can add a safety gate to cart (the page-level `addToCart` only runs inside the non-safety-gate branch).

### 2. `src/components/site/ProductCard.tsx`
- Change the safety-gate price block text from `Price upon measurement` to `Custom Measurement Required`.
- Listing card already hides quick-add for safety gates — no behavior change there.

### 3. No other files
- Cart, checkout, and wishlist code don't need changes; the safety gate has no entry point into `cart.add` once the detail page strips its non-booking UI.

## Out of scope
- No DB/schema changes.
- No changes to the measurement booking dialog itself.
- No changes to other product categories.
