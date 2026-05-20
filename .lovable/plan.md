# Build All Suggested Features

Rolling out everything from the gap analysis, grouped into 3 phases so the most valuable work ships first and the database changes batch cleanly.

## Phase 1 — Trust, Revenue & Customer Self-Service

**1. Order Tracking**
- New `/track-order` route: enter order number + phone → show status timeline (Pending payment → Confirmed → In production → Ready → Shipped → Delivered)
- Expand `/account` orders list with status chips and a "Track" link
- Public RLS policy: lookup by `order_number + customer_phone` match (no auth required)

**2. Promo Codes / Discounts**
- New `promo_codes` table: `code`, `discount_type` (percent/fixed), `discount_value`, `min_subtotal`, `max_uses`, `used_count`, `expires_at`, `is_active`
- Checkout: "Have a promo code?" field → validates and applies discount, shown as a line in the summary
- Admin page `/admin/promos`: CRUD codes, see usage

**3. Newsletter Signup**
- `newsletter_subscribers` table: `email`, `created_at`, `unsubscribed_at`
- Footer signup form + a homepage section ("Get 10% off your first order")
- Admin page `/admin/newsletter`: list + CSV export

**4. FAQ Page**
- New `/faq` route, accordion grouped by: Ordering & Payment, Shipping & Delivery, Custom Builds, Care & Safety, Returns
- Content stored in `site_content` (editable) — seed with sensible defaults
- Link in footer + header

**5. Terms & Privacy Pages**
- `/terms` and `/privacy` routes with editable content via `site_content`
- Footer links + checkout consent checkbox

## Phase 2 — Admin Operations & CRM

**6. Contact Messages Admin** — `/admin/messages`: table of `contact_messages` with realtime, mark-as-read state (new column), reply via WhatsApp/email buttons

**7. Custom Build Requests Admin** — `/admin/custom-builds`: table of `custom_build_requests`, status dropdown (new → reviewing → quoted → accepted → declined), notes field, WhatsApp customer button

**8. Customers CRM** — `/admin/customers`: aggregated view from `orders` + `profiles` showing name, phone, email, order count, total spent, last order date, with detail drawer showing all orders

**9. Sales Analytics** — Upgrade `/admin` dashboard with charts (Recharts): revenue over time (line), top 5 products (bar), orders by status (donut), bookings funnel

**10. Low-Stock Alerts** — Banner on admin dashboard + `/admin/products` highlight when `stock_quantity = 0` or below threshold (configurable per product, default 2)

## Phase 3 — Marketing & Conversion

**11. Blog** — `blog_posts` table (`title`, `slug`, `cover_image`, `excerpt`, `body_markdown`, `published_at`, `author`), `/blog` index + `/blog/$slug` detail, admin `/admin/blog` CRUD with markdown editor

**12. Product Comparison** — "Add to compare" button on product cards, floating compare bar, `/compare` page showing 2–3 cribs side-by-side (specs, price, materials, sizes)

**13. Abandoned Cart Recovery** — `abandoned_carts` table captures email at checkout step 1; cron-triggered server route sends Resend email after 24h if cart not converted

**14. Bundles / "Complete the Room"** — `bundles` table (`name`, `product_ids[]`, `discount_percent`); display on product pages ("Pairs well with…") and a `/bundles` page

**15. Size Guide / Visual Dimensions** — Per-product `dimensions_image_url` field; "View dimensions" button on product detail opens a modal with the labeled diagram

## Technical Details

**New tables / migrations (batched into 3 migrations, one per phase):**
- Phase 1: `promo_codes`, `newsletter_subscribers`, public order lookup policy
- Phase 2: `is_read` on `contact_messages`, `status`+`internal_notes` on `custom_build_requests`, `low_stock_threshold` on `products`
- Phase 3: `blog_posts`, `abandoned_carts`, `bundles`, `dimensions_image_url` on `products`

**Navigation updates:** Header gets Blog + FAQ; Footer gets Newsletter, Terms, Privacy, FAQ, Track Order; Admin sidebar gets Messages, Custom Builds, Customers, Promos, Newsletter, Blog, Bundles

**Stack:** All server logic via `createServerFn` (no edge functions); abandoned cart cron uses `/api/public/cron/abandoned-carts` + pg_cron; emails via existing Resend setup; charts via Recharts (already installed).

**Estimated scope:** ~25 new files, 3 migrations, ~10 file edits. I'll work phase by phase and check in after each phase ships so you can test before I continue.

Approve to start with Phase 1.