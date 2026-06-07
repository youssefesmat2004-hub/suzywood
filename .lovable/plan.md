## Goal
Fix the home-page Featured grid so the safety gate (category `safety-gates`) cannot be added to cart and shows "Custom Measurement Required" instead of "EGP 0".

## Changes — `src/routes/index.tsx`

1. In the `featured.map(...)` loop, compute `const isSafetyGate = p.category_slug === "safety-gates";`.
2. In `quickAdd`, early-return if `isSafetyGate` (defense-in-depth).
3. Replace the hover quick-add button when `isSafetyGate`: render a non-interactive pill "Book Measurement" that lets the parent `<Link>` navigate to the product page (no `onClick`, no `cart.add`).
4. Replace the price line:
   - If `isSafetyGate`: `Custom Measurement Required`
   - Else keep `EGP {starting_price}`.

No changes elsewhere (shop card + detail page already correct).
