# Automatic website health check every 5 days

An automatic check-up that runs every 5 days and emails you a report, so you know the
store is healthy without testing it by hand. This week's manual check is already done,
so the first automatic run happens on the next cycle.

## 1. Pages and store data

- **Key pages load**: homepage, shop, a sample product page, cart, checkout, contact,
  track-order, FAQ, custom builds — each must answer successfully, not an error page.
- **Database reachable**: products, categories, reviews and orders respond.
- **Store data sane**: at least one active product, prices present, stock not all zero,
  no product with a broken or missing main image.
- **Email system configured**: the email-sending keys exist so order emails can go out.

## 2. Every customer input is tested

Each form is submitted with clearly-marked test data, then the test record is deleted
straight after, so your real data stays clean:

- Newsletter sign-up
- Contact message
- Session booking
- Measurement booking (the one that broke before)
- Custom build request, including the photo upload
- Promo code check
- Order tracking lookup
- Checkout order creation (test order, deleted after)
- Website-experience review and the delivered-order review link

Any form that fails is named in the report with the exact error.

## 3. SEO and AI search

- Sitemap and robots file load correctly
- Homepage and key pages each have a title, description and social preview tags
- Structured data (product/organization info that Google and AI assistants read)
  is present on the homepage and a product page
- Arabic version of key pages loads and shows Arabic content
- The AI-answers file (`llms.txt`) loads

## The report email

After each run, both owner emails get a branded report:
- Green summary if everything passed, or
- A clear red list of what failed, which page or form is affected, and the error.

## How it runs

- A schedule runs every 5 days (early morning Cairo time) and calls a private hook
  on your site: `/api/public/hooks/health-check`.
- Protected by a secret key so only the scheduler can trigger it.
- You can also trigger it manually anytime with that key for an on-demand check.

## Technical details

- New server route `src/routes/api/public/hooks/health-check.ts`: verifies a
  `CRON_SECRET` bearer token, runs page fetches, form submissions through the existing
  public server functions/admin client, SEO/metadata assertions, then emails the report
  through the existing Resend gateway pattern used in `owner-notifications.functions.ts`
  (same two owner emails).
- Test rows are inserted and deleted within the same run, tagged with a
  `HEALTHCHECK` marker so any leftover row is easy to spot and purge.
- `pg_cron` + `pg_net` enabled if needed, plus a `cron.schedule` entry running
  `0 3 */5 * *`, configured via run_sql (not a migration, since it carries the secret).
- New secret `CRON_SECRET` added to the project.
- No changes to the storefront or admin UI.
