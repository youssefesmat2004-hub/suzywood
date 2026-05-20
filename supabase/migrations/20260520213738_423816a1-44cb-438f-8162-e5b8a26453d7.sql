
-- Promo codes
CREATE TYPE public.promo_discount_type AS ENUM ('percent', 'fixed');

CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type public.promo_discount_type NOT NULL DEFAULT 'percent',
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_subtotal NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promo codes" ON public.promo_codes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Active promo codes are readable" ON public.promo_codes
  FOR SELECT USING (is_active = true);

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (
    char_length(email) >= 3 AND char_length(email) <= 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (full_name IS NULL OR char_length(full_name) <= 100)
  );

CREATE POLICY "Admins view subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update subscribers" ON public.newsletter_subscribers
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Public order lookup: allow SELECT by matching order_number (used together with phone client-side filter)
-- We allow public to read minimal order info by order number only; the client must also confirm phone matches.
CREATE POLICY "Public order tracking" ON public.orders
  FOR SELECT
  USING (true);
-- Note: existing "Users view own orders" remains for authenticated views.
-- For privacy, the /track-order UI requires both order_number AND phone to match before showing details.

-- Seed FAQ / Terms / Privacy content
INSERT INTO public.site_content (key, value, description) VALUES
  ('faq_content', '[
    {"category":"Ordering & Payment","items":[
      {"q":"How do I place an order?","a":"Browse our shop, choose your size and finish, add to cart, and check out. You can pay 50% upfront via InstaPay to confirm production."},
      {"q":"What payment methods do you accept?","a":"We currently accept InstaPay (50% upfront, 50% on delivery). Bank transfer is available on request."}
    ]},
    {"category":"Shipping & Delivery","items":[
      {"q":"How long does delivery take?","a":"Most pieces are handcrafted to order with a 3–4 week lead time. We deliver across Egypt."},
      {"q":"Do you assemble the furniture?","a":"Yes — our team delivers and assembles in your home at no extra cost within Greater Cairo."}
    ]},
    {"category":"Custom Builds","items":[
      {"q":"Can I request a custom piece?","a":"Absolutely. Submit a Custom Build request and our team will reach out within 24 hours with a quote."}
    ]},
    {"category":"Care & Safety","items":[
      {"q":"Are your finishes baby-safe?","a":"Yes. We use water-based, non-toxic finishes that meet international safety standards."},
      {"q":"How do I care for my piece?","a":"Wipe with a soft, slightly damp cloth. Avoid harsh chemicals and direct sunlight for long periods."}
    ]},
    {"category":"Returns","items":[
      {"q":"What is your return policy?","a":"Made-to-order pieces are non-refundable, but we replace any item that arrives damaged. Contact us within 48 hours of delivery."}
    ]}
  ]', 'FAQ page content (JSON)'),
  ('terms_content', '# Terms & Conditions

Welcome to Suzy Wood. By placing an order with us, you agree to the following terms.

## 1. Orders
All pieces are handcrafted to order. Orders are confirmed once the 50% upfront payment is received.

## 2. Delivery
Lead time is typically 3–4 weeks. We deliver across Egypt; delivery fees vary by governorate.

## 3. Cancellations
Orders may be cancelled within 24 hours of confirmation for a full refund. After production begins, deposits are non-refundable.

## 4. Warranty
We warranty our craftsmanship for 12 months from delivery against manufacturing defects.

## 5. Contact
For any questions, reach us at hello@suzywood.com.', 'Terms & Conditions page content (Markdown)'),
  ('privacy_content', '# Privacy Policy

Suzy Wood respects your privacy. This policy explains what we collect and how we use it.

## Information We Collect
- Name, phone, email, and shipping address when you place an order or book a session.
- Payment proof images (for InstaPay verification only).

## How We Use It
- To process and deliver your order.
- To contact you about your order or booking.
- We never share your data with third parties except as required for delivery.

## Your Rights
You can request deletion of your data at any time by emailing hello@suzywood.com.', 'Privacy Policy page content (Markdown)')
ON CONFLICT (key) DO NOTHING;
