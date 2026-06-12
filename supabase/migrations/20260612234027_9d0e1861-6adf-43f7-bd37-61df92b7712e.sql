
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_area TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_size_type TEXT DEFAULT 'big';

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  _details jsonb,
  _items jsonb,
  _upfront_rate numeric,
  _promo_code text,
  _instapay_reference text,
  _payment_proof_path text,
  _delivery_area text DEFAULT NULL,
  _order_size_type text DEFAULT 'big'
)
 RETURNS TABLE(id uuid, order_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_total numeric;
  v_upfront numeric;
  v_remaining numeric;
  v_item jsonb;
  v_product_id uuid;
  v_product_starting_price numeric;
  v_product_is_active boolean;
  v_product_category uuid;
  v_min_price numeric;
  v_line_total numeric;
  v_promo_id uuid;
  v_promo_discount numeric := 0;
  v_promo_code text;
  v_category_custom_enabled boolean;
  v_category_custom_surcharge numeric;
  v_allowed_surcharge numeric;
  v_variant_price numeric;
  v_storewide_rate constant numeric := 0.95;
  v_shipping_fee numeric := 0;
  v_area text;
  v_size_type text;
  v_all_small boolean := true;
  v_cat_slug text;
  v_notes text;
BEGIN
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'No items in order';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    IF (v_item->>'quantity')::int <= 0 OR (v_item->>'unit_price')::numeric < 0 THEN
      RAISE EXCEPTION 'Invalid quantity or price';
    END IF;

    SELECT p.id, p.starting_price, p.is_active, p.category_id
      INTO v_product_id, v_product_starting_price, v_product_is_active, v_product_category
      FROM public.products p
      WHERE p.id = (v_item->>'product_id')::uuid;

    IF v_product_id IS NULL OR NOT v_product_is_active THEN
      RAISE EXCEPTION 'Product not available: %', v_item->>'product_name';
    END IF;

    SELECT c.slug INTO v_cat_slug FROM public.categories c WHERE c.id = v_product_category;
    IF v_cat_slug NOT IN ('swings', 'play-safety', 'learning-tower') THEN
      v_all_small := false;
    END IF;

    v_variant_price := NULL;
    IF COALESCE(v_item->>'size', '') <> '' THEN
      SELECT pv.price
        INTO v_variant_price
        FROM public.product_variants pv
        WHERE pv.product_id = v_product_id
          AND pv.is_active = true
          AND pv.name = v_item->>'size'
        LIMIT 1;
    END IF;

    v_allowed_surcharge := 0;
    IF COALESCE(v_item->>'custom_width_cm', '') <> ''
       OR COALESCE(v_item->>'custom_length_cm', '') <> ''
       OR COALESCE(v_item->>'custom_surcharge', '') <> '' THEN
      SELECT c.custom_size_enabled, COALESCE(c.custom_size_surcharge, 0)
        INTO v_category_custom_enabled, v_category_custom_surcharge
        FROM public.categories c
        WHERE c.id = v_product_category;

      IF NOT COALESCE(v_category_custom_enabled, false) THEN
        RAISE EXCEPTION 'Custom sizing not available for %', v_item->>'product_name';
      END IF;
      v_allowed_surcharge := v_category_custom_surcharge;
    END IF;

    v_min_price := (COALESCE(v_variant_price, v_product_starting_price) * v_storewide_rate) + v_allowed_surcharge;

    IF (v_item->>'unit_price')::numeric < v_min_price - 1 THEN
      RAISE EXCEPTION 'Item price too low for %', v_item->>'product_name';
    END IF;

    v_line_total := (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  v_promo_code := NULLIF(trim(upper(COALESCE(_promo_code, ''))), '');
  IF v_promo_code IS NOT NULL THEN
    SELECT pc.id, pc.discount_amount, pc.code
      INTO v_promo_id, v_promo_discount, v_promo_code
      FROM public.validate_promo_code(v_promo_code, v_subtotal) pc;
    IF v_promo_id IS NULL THEN
      RAISE EXCEPTION 'Invalid promo code';
    END IF;
    v_discount := COALESCE(v_promo_discount, 0);
  END IF;

  -- Determine size type server-side (trust DB over client claim)
  v_size_type := CASE WHEN v_all_small THEN 'small' ELSE 'big' END;
  v_area := lower(NULLIF(trim(COALESCE(_delivery_area, '')), ''));

  -- Compute shipping fee server-side from the canonical table
  v_shipping_fee := CASE v_area
    WHEN 'maadi'           THEN CASE WHEN v_size_type='small' THEN 300  ELSE 500  END
    WHEN 'zamalek'         THEN CASE WHEN v_size_type='small' THEN 500  ELSE 700  END
    WHEN 'dokki'           THEN CASE WHEN v_size_type='small' THEN 500  ELSE 700  END
    WHEN 'masr-al-gedida'  THEN CASE WHEN v_size_type='small' THEN 500  ELSE 700  END
    WHEN 'nasr-city'       THEN CASE WHEN v_size_type='small' THEN 500  ELSE 700  END
    WHEN 'new-cairo'       THEN CASE WHEN v_size_type='small' THEN 700  ELSE 1000 END
    WHEN 'shorouk-madinty' THEN CASE WHEN v_size_type='small' THEN 700  ELSE 1200 END
    WHEN 'obour'           THEN CASE WHEN v_size_type='small' THEN 800  ELSE 1500 END
    WHEN 'sheikh-zayed'    THEN CASE WHEN v_size_type='small' THEN 700  ELSE 1000 END
    ELSE 0
  END;

  v_notes := COALESCE(_details->>'notes', '');
  IF v_area IS NULL OR v_area = 'other' THEN
    v_shipping_fee := 0;
    v_notes := trim(('[Delivery fee TBD — confirm via WhatsApp] ' || v_notes));
  END IF;

  v_total := GREATEST(0, v_subtotal - v_discount) + v_shipping_fee;
  v_upfront := ROUND(GREATEST(0, v_subtotal - v_discount) * COALESCE(_upfront_rate, 0.75));
  v_remaining := v_total - v_upfront;

  INSERT INTO public.orders (
    customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_governorate, notes,
    subtotal, discount_amount, discount_code, promo_code, total, total_amount,
    shipping_fee, delivery_area, order_size_type,
    upfront_amount, deposit_amount, remaining_amount, payment_method,
    payment_status, status, instapay_reference, transaction_id,
    payment_proof_path, payment_proof_url, user_id
  ) VALUES (
    _details->>'name', _details->>'email', _details->>'phone',
    _details->>'address', _details->>'city', _details->>'governorate', v_notes,
    v_subtotal, v_discount, v_promo_code, v_promo_code, v_total, v_total,
    v_shipping_fee, v_area, v_size_type,
    v_upfront, v_upfront, v_remaining, 'instapay',
    'pending', 'pending_payment'::public.order_status, NULLIF(trim(_instapay_reference), ''), NULLIF(trim(_instapay_reference), ''),
    NULLIF(trim(_payment_proof_path), ''), NULLIF(trim(_payment_proof_path), ''), auth.uid()
  ) RETURNING orders.id, orders.order_number INTO v_order_id, v_order_number;

  INSERT INTO public.order_items (
    order_id, product_id, product_name, size, finish, engraving,
    unit_price, quantity, line_total,
    custom_width_cm, custom_length_cm, custom_surcharge,
    bed_rails, bed_rails_price
  )
  SELECT
    v_order_id,
    (it->>'product_id')::uuid,
    it->>'product_name',
    NULLIF(it->>'size', ''),
    NULLIF(it->>'finish', ''),
    NULLIF(it->>'engraving', ''),
    (it->>'unit_price')::numeric,
    (it->>'quantity')::int,
    (it->>'unit_price')::numeric * (it->>'quantity')::int,
    NULLIF(it->>'custom_width_cm', '')::numeric,
    NULLIF(it->>'custom_length_cm', '')::numeric,
    NULLIF(it->>'custom_surcharge', '')::numeric,
    COALESCE((it->>'bed_rails')::boolean, false),
    COALESCE(NULLIF(it->>'bed_rails_price', '')::numeric, 0)
  FROM jsonb_array_elements(_items) it;

  IF v_promo_id IS NOT NULL THEN
    UPDATE public.promo_codes
      SET used_count = COALESCE(used_count, 0) + 1
      WHERE id = v_promo_id;
  END IF;

  RETURN QUERY SELECT v_order_id, v_order_number;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb, numeric, text, text, text, text, text) TO anon, authenticated;
