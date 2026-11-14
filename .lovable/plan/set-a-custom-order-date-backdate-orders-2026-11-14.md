# Set a custom order date (backdate orders)

## What you'll get
- In the **Add WhatsApp Order** and **Edit order** window, a new **Order date** field (defaults to today).
- You can pick any past date (e.g. a day in October). Future dates are blocked.
- The order then counts in that month on the Analytics/profit page, and shows that date in the orders list.
- Also works for editing existing orders (including website orders) from the admin, so a wrong date can be corrected.

## Technical details
- `ManualOrderModal.tsx`: add a date input (`type="date"`, max = today), prefilled from the order's `created_at` when editing.
- `manual-orders.functions.ts`: accept optional `order_date` (validated: valid date, not in the future, not before 2024), admin-only, and write it to `orders.created_at` (noon Cairo time to avoid timezone shifting to the previous day) on create and update.
- Analytics already groups by `created_at`, so no change needed there. No database change required.
