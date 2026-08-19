# Deposit excludes delivery cost

Delivery should not be part of the 75% deposit. It moves entirely into the amount paid on delivery.

## New math (WhatsApp / manual orders)

```text
Total      = Product price + Delivery cost
Deposit    = 75% of Product price only
Remaining  = 25% of Product price + Delivery cost
```

## What changes

- Add WhatsApp Order modal: the auto-calculated Deposit and Remaining fields follow the formula above, so typing a delivery cost only raises the remaining amount, never the deposit.
- Summary box in the modal: show the split clearly — Product, Delivery, Total, then "Deposit due now (75% of product)" and "Remaining on delivery (25% + delivery)".
- Field labels updated to "Deposit (75% of product price)" and "Remaining on Delivery (25% + delivery)".

Website checkout already calculates the deposit from the product subtotal only and adds delivery to the remaining amount, so no change is needed there.

## Technical notes

- `src/components/admin/ManualOrderModal.tsx`: `recalc()` computes `upfront = round(product * 0.75)` and `remaining = total - upfront`; update labels and summary rows.
- Values are still saved as `upfront_amount` / `remaining_amount`, so order emails, order details, and carpenter/profit views pick up the new split automatically. No database or server-function changes.
