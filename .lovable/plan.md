## Plan

1. **Add a clear payment confirmation action**
   - Add a prominent **Confirm payment** button on the admin order detail page.
   - When clicked, it will set the order status to `confirmed`.
   - Show a saving state and prevent double-clicks while the update is running.
   - Keep the existing status dropdown as a secondary control, but make the button the obvious path for pending-payment orders.

2. **Make ordered items easier to see**
   - Keep the existing item list but add an empty/error state so admins can tell if items failed to load instead of seeing a blank section.
   - Show product name, quantity, size, finish, unit price, and line total where allowed.
   - Include a clear message if no items are attached to the order.

3. **Improve reliability of status updates**
   - Update the status function so success/failure feedback is always visible.
   - Revert the UI if the backend update fails.
   - Keep email notification after a successful status update, without blocking the status change if email fails.

4. **Validate the page after implementation**
   - Check that the order detail page loads.
   - Confirm the new button appears for pending payment orders.
   - Confirm the Items section visibly shows ordered products or a clear fallback message.