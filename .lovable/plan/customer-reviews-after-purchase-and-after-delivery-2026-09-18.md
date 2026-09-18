# Customer reviews after purchase and after delivery

Two moments where customers can rate you, with their words appearing on the site automatically.

## 1. Right after checkout (website experience)

On the thank-you page shown after an order is placed, add a short card:
"How was your ordering experience?" with 1-5 stars and an optional comment.
No sign-in needed - it is tied to the order that was just placed, and can only
be submitted once per order.

## 2. After the order is delivered (product and service quality)

When an order is marked **Delivered & Completed** in the admin panel, the
customer automatically receives a branded email:

- Thank-you message in the existing Suzy Wood email style
- A big "Leave a review" button linking to a private review page
- The link carries a one-time code, so only that customer can use it, and only once

The review page shows what they bought and asks for:
- Product quality rating (1-5 stars)
- Service and delivery rating (1-5 stars)
- A short written comment
- Their display name (pre-filled from the order, editable)

## Publishing rules

- 4 and 5 star reviews go live on the site immediately
- 1-3 star reviews are held as pending and only appear if you approve them in admin
- Every review, published or not, is listed in a new **Reviews** page in the
  admin panel where you can publish, hide, or delete it

## Where reviews appear

- **Homepage**: real customer reviews are mixed into the existing reviews
  carousel (newest first), alongside the current Facebook testimonials
- **Product pages**: a delivered-order review for a product shows under that
  product, together with the existing review section and the star average

## Emails

- Review invite email fires automatically when status becomes Delivered
- Sent once per order (tracked with a timestamp, same pattern as your other
  order emails), so re-saving the order will not spam the customer

## Technical notes

- New table `order_reviews`: order_id, product_id (nullable), token, name,
  experience_rating, product_rating, service_rating, comment, is_published,
  submitted_at, plus timestamps. RLS: public read of published rows only;
  all writes go through validated server functions using the admin client
  (guests have no session). GRANTs for anon/authenticated/service_role.
- New column `orders.review_email_sent_at` and `orders.review_token`.
- `src/lib/reviews.functions.ts`: `submitExperienceReview` (by order id +
  order number check), `validateReviewToken`, `submitDeliveryReview` - all
  Zod-validated, rate-limited to one submission per order/token.
- Review email added to `src/lib/order-emails.functions.ts` (new template
  + trigger on transition to `delivered`, guarded by `review_email_sent_at`).
- New route `src/routes/review.tsx` (token in search params), with its own
  head() metadata and noindex.
- `CustomerReviews.tsx` loads published `order_reviews` and merges them with
  the static testimonials; product page review list gains delivered-order
  reviews.
- New admin route `src/routes/admin.reviews.tsx` + nav entry, reading through
  an admin-only path, with publish/hide/delete actions.
- All customer-facing strings added to the Arabic i18n sections so the review
  page and emails-driven UI work in both languages.
