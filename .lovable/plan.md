# Fix WhatsApp manual order email validation error

## Problem
The "Add WhatsApp Order" form rejects submissions with an `Invalid email` error because `customer_email` is required to be a valid email. WhatsApp customers frequently do not provide email addresses, blocking order creation.

## What we'll change
1. **Backend schema**: Make `customer_email` optional in `createManualOrder` and `updateManualOrder` validation in `src/lib/manual-orders.functions.ts`. Store it as an empty string or `null` when missing.
2. **Frontend form**: Remove the `required` attribute and email-type validation from the `Customer email` input in `src/components/admin/ManualOrderModal.tsx`, and update the local form type.
3. **Admin order list**: Handle blank emails in `src/routes/admin.orders.index.tsx` so the row still renders.
4. **Email notifications**: Ensure status/update notification emails are only sent when a valid email exists; skip silently otherwise (no crash).
5. **Type definitions**: Update `ManualOrderExisting` and related types to allow empty/optional email.

## Files affected
- `src/lib/manual-orders.functions.ts`
- `src/components/admin/ManualOrderModal.tsx`
- `src/routes/admin.orders.index.tsx`
- `src/lib/order-emails.functions.ts` (guard for missing email)

## Verification
- Create a WhatsApp order with only a name and phone number — no email.
- Create a WhatsApp order with a valid email — still works.
- Confirm the order list shows the new order and no console errors.
