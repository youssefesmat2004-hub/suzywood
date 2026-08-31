# Let guests upload payment screenshots at checkout

Right now, uploading a payment screenshot requires a signed-in account. Guests checking out see "Please sign in to upload a payment screenshot" and their order proof never reaches you. Since almost all customers check out as guests, this blocks the most useful part of payment verification.

## What changes

- Guests can attach a payment screenshot at checkout with no account needed.
- The file goes to your private payment-proofs storage; only admins can view it, exactly as today.
- The sign-in warning is removed from the checkout flow.
- Safety limits stay: images/PDF only, max ~10MB, one file per order.

## Technical approach

- Add a public server function (`uploadPaymentProof` in `src/lib/public-submissions.functions.ts` or a new `payment-proof.functions.ts`) that:
  - accepts the file as base64 + filename + mime, validated with Zod
  - rejects anything that is not `image/*` or `application/pdf`, or larger than 10MB
  - uploads via the admin storage client (loaded inside the handler) to `payment-proofs/guest/<uuid>.<ext>`
  - returns only the storage path
- Update `src/routes/checkout.tsx`: replace the `user?.id` guard + direct `supabase.storage.upload` call with the server function; signed-in users use the same path.
- Keep the bucket private and keep the existing anon-write restriction on `storage.objects` — the server function is the only guest write path, so no policy loosening is needed.
- Admin order detail already signs the stored path for viewing, so it keeps working unchanged.
