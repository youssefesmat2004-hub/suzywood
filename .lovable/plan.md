## Problem

The cart page shows a hardcoded "Shipping EGP 1,000" line and adds it to the total. Since shipping now depends on the delivery area (selected at checkout), this is misleading.

## Fix

Edit `src/routes/cart.tsx`:

- Remove the `SHIPPING = 1000` constant.
- Remove the "Shipping" line from the order summary.
- Show `Total` = `subtotal` only, with a small helper note: "Delivery fee calculated at checkout based on your area."

No changes to checkout, cart logic, or backend — area selection and fee calculation already happen on the checkout page.