## Goal
Enforce at the database layer that `custom_build_requests.user_id` can never be a spoofed value — it must equal `auth.uid()` for authenticated callers, or `NULL` for anonymous callers. The server-function/Zod fix already shipped; this plan adds defense-in-depth in SQL so even a direct insert (or a future code path using `supabaseAdmin`) cannot attribute a request to a victim's account.

## Migration (SQL only)

1. Create a `BEFORE INSERT` trigger function `public.enforce_custom_build_user_id()` that:
   - Sets `NEW.user_id := auth.uid()` when `auth.uid() IS NOT NULL`.
   - Sets `NEW.user_id := NULL` when `auth.uid() IS NULL` (anonymous insert).
   - This makes any client-supplied `user_id` irrelevant — it's always overwritten server-side by Postgres.
   - `SECURITY INVOKER`, `SET search_path = public`.

2. Attach the trigger to `public.custom_build_requests` for `BEFORE INSERT FOR EACH ROW`.

3. Tighten the existing INSERT RLS policy `WITH CHECK` to `user_id IS NOT DISTINCT FROM auth.uid()` so the policy itself rejects any mismatched value (belt-and-braces with the trigger; the trigger normalizes, the policy verifies).

4. Leave SELECT/UPDATE policies untouched.

## Notes

- No table schema changes, no GRANT changes (existing grants stand).
- `supabaseAdmin` writes bypass RLS but **not** triggers, so the trigger also protects server-side admin paths.
- No application code changes — the server fn already hardcodes `null` and the Zod schema already excludes `user_id`.

## Findings left untouched (mentioned for your review)

These were in the scan results but explicitly out of scope for this request:
- `lookup_order_like_phone` — order-tracking RPC uses suffix `LIKE` match on phone.
- `order_upfront_rate_unvalidated` — `create_order_with_items` accepts any `_upfront_rate`.
- `orders_anonymous_insert` — informational; relies on the SECURITY DEFINER RPC being the only insert path.
- `realtime_orders_non_staff_authenticated` — realtime topic policy has an open `ELSE true`.
- `notify_fns_no_auth` — unauthenticated owner/customer notification server functions.
- `custom_build_user_id_spoof` / `custom_build_requests_user_id_spoofing` — should auto-clear once this migration lands.
