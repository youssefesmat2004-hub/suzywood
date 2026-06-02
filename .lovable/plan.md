## Plan

1. **Restore the broken preview first**
   - Remove the remote Google Fonts `@import` from `src/styles.css`, because Vite is currently failing to transform the stylesheet (`ENOENT ... fonts.googleapis.com`).
   - Keep the existing font-family fallbacks so the app can load again.

2. **Fix the admin order detail page**
   - Replace the fragile embedded relationship query on `/admin/orders/$id` with separate reads for:
     - the order row
     - its `order_items`
     - product image URLs
   - Show a clear empty/error state if item rows are missing instead of silently rendering an empty list.

3. **Make status updates reliable**
   - Update order status with `.select(...).single()` after the update, so the UI can confirm the database actually accepted the change.
   - Roll back the dropdown UI and show the backend error if the update is blocked.
   - Keep the existing customer notification email attempt after a successful status update.

4. **Verify in preview**
   - Reopen the same order detail page.
   - Confirm the two saved order items appear.
   - Change status and confirm the visible status updates without errors.