# Weekly automatic website health check

An automatic check-up that runs once a week and emails you a report, so you know the
store is healthy without testing it by hand. This week's manual check is already done,
so the first automatic run happens next week.

## What the weekly check covers

- **Key pages load**: homepage, shop, a sample product page, cart, checkout, contact,
  track-order, FAQ — each must answer successfully (not an error page).
- **Database reachable**: products, categories, reviews and orders tables respond.
- **Store data sane**: at least one active product, prices present, stock not all zero.
- **Checkout-critical functions respond**: promo-code validation and order lookup
  return proper answers (not crashes) for test input.
- **Email system configured**: the email-sending keys exist so order emails can go out.

## The report email

After the run, you (both owner emails) get a branded email:
- Green summary if everything passed, or
- A clear red list of what failed and which page/feature is affected.

## How it runs

- A weekly schedule (every Monday morning Cairo time) calls a private hook on your
  site: `/api/public/hooks/weekly-health-check`.
- The hook is protected with a secret key so only the scheduler can trigger it.
- You can also trigger it manually anytime by visiting the hook URL with the key,
  if you ever want an on-demand check.

## Technical details

- New TanStack server route `src/routes/api/public/hooks/weekly-health-check.ts`:
  verifies a `CRON_SECRET` bearer token, runs the checks with fetch + a public-safe
  Supabase client, and sends the report via the existing Resend gateway pattern from
  `owner-notifications.functions.ts` (same owner emails).
- `pg_cron` + `pg_net` enabled (if not already) and a weekly `cron.schedule` entry
  calling the hook URL — set up via run_sql (not a migration, since it contains the
  secret).
- New secret `CRON_SECRET` added to the project.
- No changes to the storefront or admin UI.
