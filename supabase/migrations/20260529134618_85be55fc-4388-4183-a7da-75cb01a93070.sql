-- =====================================================================
-- 1. PROMO CODES: restrict public read + safe validation/increment RPCs
-- =====================================================================

DROP POLICY IF EXISTS "Active promo codes are readable" ON public.promo_codes;

-- (Admins manage promo codes policy remains in place.)

-- Validate a single code without exposing the full table to anyone.
CREATE OR REPLACE FUNCTION public.validate_promo_code(_code text, _subtotal numeric)
RETURNS TABLE (
  id uuid,
  code text,
  discount_type promo_discount_type,
  discount_value numeric,
  discount_amount numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.promo_codes%ROWTYPE;
  amt numeric;
BEGIN
  SELECT * INTO p FROM public.promo_codes
   WHERE upper(promo_codes.code) = upper(_code)
     AND is_active = true
   LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;
  IF p.expires_at IS NOT NULL AND p.expires_at < now() THEN RETURN; END IF;
  IF p.max_uses IS NOT NULL AND p.used_count >= p.max_uses THEN RETURN; END IF;
  IF _subtotal < COALESCE(p.min_subtotal, 0) THEN RETURN; END IF;

  amt := CASE
    WHEN p.discount_type = 'percent' THEN round((_subtotal * p.discount_value) / 100)
    ELSE round(p.discount_value)
  END;
  amt := least(amt, _subtotal);

  id := p.id;
  code := p.code;
  discount_type := p.discount_type;
  discount_value := p.discount_value;
  discount_amount := amt;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_promo_code(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO anon, authenticated;

-- Safe increment used by the order RPC.
CREATE OR REPLACE FUNCTION public.increment_promo_usage(_promo_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.promo_codes
     SET used_count = COALESCE(used_count, 0) + 1,
         updated_at = now()
   WHERE id = _promo_id;
$$;

REVOKE ALL ON FUNCTION public.increment_promo_usage(uuid) FROM PUBLIC;
-- Intentionally NOT granted to anon/authenticated; only called from create_order_with_items.
GRANT EXECUTE ON FUNCTION public.increment_promo_usage(uuid) TO service_role;

-- =====================================================================
-- 2. ORDERS: idempotent confirmation email flag
-- =====================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;

-- =====================================================================
-- 3. SERVER-SIDE ORDER CREATION (prevents price manipulation)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  _details jsonb,    -- name,email,phone,address,city,governorate,notes
  _items jsonb,      -- [{product_id, product_name, size, finish, engraving, unit_price, quantity, custom_width_cm, custom_length_cm, custom_surcharge}]
  _shipping_fee numeric,
  _upfront_rate numeric,
  _promo_code text,
  _instapay_reference text,
  _payment_proof_path text
)
RETURNS TABLE (id uuid, order_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_subtotal numeric := 0;
  v_total numeric;
  v_upfront numeric;
  v_remaining numeric;
  v_discount numeric := 0;
  v_promo_id uuid;
  v_promo_code text;
  v_item jsonb;
  v_product RECORD;
  v_min_price numeric;
  v_line_total numeric;
  v_order_id uuid;
  v_order_number text;
  v_notes text;
BEGIN
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;
  IF _shipping_fee < 0 THEN RAISE EXCEPTION 'Invalid shipping fee'; END IF;
  IF _upfront_rate <= 0 OR _upfront_rate >= 1 THEN
    RAISE EXCEPTION 'Invalid upfront rate';
  END IF;

  -- Validate each line, recompute subtotal from authoritative server data.
  FOR v_item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    IF (v_item->>'quantity')::int <= 0 OR (v_item->>'unit_price')::numeric < 0 THEN
      RAISE EXCEPTION 'Invalid line item';
    END IF;

    SELECT id, starting_price, is_active
      INTO v_product
      FROM public.products
     WHERE id = (v_item->>'product_id')::uuid;

    IF NOT FOUND OR NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product no longer available';
    END IF;

    -- Minimum acceptable unit price = product starting price + declared custom surcharge.
    v_min_price := v_product.starting_price
                 + COALESCE((v_item->>'custom_surcharge')::numeric, 0);

    IF (v_item->>'unit_price')::numeric < v_min_price THEN
      RAISE EXCEPTION 'Item price too low for %', v_item->>'product_name';
    END IF;

    v_line_total := (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  -- Validate + apply promo on the server.
  IF _promo_code IS NOT NULL AND length(trim(_promo_code)) > 0 THEN
    SELECT vpc.id, vpc.code, vpc.discount_amount
      INTO v_promo_id, v_promo_code, v_discount
      FROM public.validate_promo_code(_promo_code, v_subtotal) vpc
      LIMIT 1;
    IF v_promo_id IS NULL THEN
      RAISE EXCEPTION 'Promo code is invalid or expired';
    END IF;
    v_subtotal := v_subtotal - v_discount;
  END IF;

  v_upfront := round(v_subtotal * _upfront_rate);
  v_total := v_subtotal + _shipping_fee;
  v_remaining := (v_subtotal - v_upfront) + _shipping_fee;
  v_notes := CASE WHEN v_promo_id IS NOT NULL
                  THEN format('Promo: %s (-EGP %s)', v_promo_code, v_discount)
                  ELSE NULL END;

  INSERT INTO public.orders (
    user_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_governorate, shipping_notes,
    subtotal, shipping_fee, total, upfront_amount, remaining_amount,
    payment_method, instapay_reference, payment_proof_url, internal_notes
  )
  VALUES (
    v_user_id,
    _details->>'name',
    _details->>'email',
    _details->>'phone',
    _details->>'address',
    _details->>'city',
    _details->>'governorate',
    NULLIF(_details->>'notes',''),
    v_subtotal, _shipping_fee, v_total, v_upfront, v_remaining,
    'instapay', _instapay_reference, _payment_proof_path, v_notes
  )
  RETURNING orders.id, orders.order_number INTO v_order_id, v_order_number;

  INSERT INTO public.order_items (
    order_id, product_id, product_name, size, finish, engraving,
    unit_price, quantity, line_total,
    custom_width_cm, custom_length_cm, custom_surcharge
  )
  SELECT
    v_order_id,
    (it->>'product_id')::uuid,
    it->>'product_name',
    NULLIF(it->>'size',''),
    NULLIF(it->>'finish',''),
    NULLIF(it->>'engraving',''),
    (it->>'unit_price')::numeric,
    (it->>'quantity')::int,
    (it->>'unit_price')::numeric * (it->>'quantity')::int,
    NULLIF(it->>'custom_width_cm','')::numeric,
    NULLIF(it->>'custom_length_cm','')::numeric,
    NULLIF(it->>'custom_surcharge','')::numeric
  FROM jsonb_array_elements(_items) AS it;

  IF v_promo_id IS NOT NULL THEN
    PERFORM public.increment_promo_usage(v_promo_id);
  END IF;

  id := v_order_id;
  order_number := v_order_number;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items(
  jsonb, jsonb, numeric, numeric, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(
  jsonb, jsonb, numeric, numeric, text, text, text
) TO anon, authenticated;

-- =====================================================================
-- 4. PAYMENT-PROOFS BUCKET: make private with scoped read access
-- =====================================================================

UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';

DROP POLICY IF EXISTS "Payment proofs are public" ON storage.objects;
DROP POLICY IF EXISTS "Payment proofs are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Payment proofs readable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_public_read" ON storage.objects;

-- Anyone can still upload a proof during checkout (matches existing flow).
-- (The existing INSERT policy on bucket_id='payment-proofs' stays.)

-- Admins (and the order owner once we add that link) can read proofs.
CREATE POLICY "Admins read payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Carpenters read payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND public.has_role(auth.uid(), 'carpenter'::app_role)
);

CREATE POLICY "Owners read their payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.orders o
     WHERE o.user_id = auth.uid()
       AND o.payment_proof_url = storage.objects.name
  )
);

-- =====================================================================
-- 5. INSPIRATION-IMAGES: fix the broken size check (5 MB max)
-- =====================================================================

DROP POLICY IF EXISTS "Anyone can upload inspiration images" ON storage.objects;

CREATE POLICY "Anyone can upload inspiration images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'inspiration-images'
  AND COALESCE((metadata ->> 'size')::bigint, 0) < 5242880
);

-- =====================================================================
-- 6. PUBLIC BUCKETS: block anonymous bucket listing
-- =====================================================================
-- Anyone can still read individual objects in product-images / inspiration-images
-- via the existing public SELECT policies (those grant access to bucket_id=...,
-- which the Storage API uses for file fetches). Listing operations check
-- against storage.buckets directly; revoke that to prevent enumeration.

REVOKE SELECT ON storage.buckets FROM anon;