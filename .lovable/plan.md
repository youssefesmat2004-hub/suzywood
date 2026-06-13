## Goal
Restrict product lead time to a range of 1–4 weeks (currently unbounded 0+).

## Changes

### Database
- Clamp the one existing out-of-range product (`The Masterpiece Crib`, currently 5 weeks) down to 4.
- Add a `CHECK` constraint on `products.lead_time_weeks` enforcing values between 1 and 4.

### Admin Product Form
- Change the "Lead time (weeks)" input from `min={0}` to `min={1}` and add `max={4}`.
- Keep the default value at 4 weeks.

### Files
- `supabase/migrations/<new>.sql`
- `src/components/admin/ProductForm.tsx`