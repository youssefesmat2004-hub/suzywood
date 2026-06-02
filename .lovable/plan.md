## Plan

1. **Make order rows navigate reliably**
   - Replace the clickable `<tr>` pattern in `/admin/orders` with proper TanStack `<Link>` navigation for each row/cell.
   - This preserves normal link behavior and avoids click handling being swallowed or not triggering navigation.

2. **Fix order detail loading**
   - Check why `/admin/orders/:id` is loading but not showing order contents.
   - Ensure the detail page fetches the selected order and its items with a resilient query, including a fallback if nested `order_items` loading fails.
   - Add clearer admin-facing error/empty states instead of silently showing nothing useful.

3. **Fix status changes**
   - Update the status save flow so the order status changes first and stays visible immediately.
   - Keep the customer notification email attempt separate, so Resend sandbox failures do not make it look like the status update failed.
   - Show a clear toast if the email is blocked by the current test-only email limitation.

4. **Verify the real signals**
   - Confirm the admin order detail URL opens for the test order.
   - Confirm the order items render.
   - Confirm changing status sends the database update request and the UI reflects the new status.