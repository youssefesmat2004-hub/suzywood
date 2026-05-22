UPDATE site_content SET value = '# Privacy Policy

Suzy Wood respects your privacy. This policy explains what we collect and how we use it.

## Information We Collect
- Name, phone, and shipping address when you place an order or book a session.
- Payment proof images (for InstaPay verification only).

## How We Use It
- To process and deliver your order.
- To contact you about your order or booking.
- We never share your data with third parties except as required for delivery.

## Your Rights
You can request deletion of your data at any time by reaching us on WhatsApp at +20 109 631 3532.' WHERE key = 'privacy_content';

UPDATE site_content SET value = '# Terms & Conditions

Welcome to Suzy Wood. By placing an order with us, you agree to the following terms.

## 1. Orders
All pieces are handcrafted to order. Orders are confirmed once the 70% upfront payment is received.

## 2. Delivery
Lead time is typically 3–4 weeks. We deliver across Egypt; delivery fees vary by governorate.

## 3. Cancellations
Orders may be cancelled within 24 hours of confirmation for a full refund. After production begins, deposits are non-refundable.

## 4. Warranty
We warranty our craftsmanship for 12 months from delivery against manufacturing defects.

## 5. Contact
For any questions, reach us on WhatsApp at +20 109 631 3532.' WHERE key = 'terms_content';

DELETE FROM site_content WHERE key = 'contact_email';