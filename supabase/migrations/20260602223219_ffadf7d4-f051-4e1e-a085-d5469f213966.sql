CREATE OR REPLACE FUNCTION public.create_order_with_items(_details jsonb, _items jsonb, _upfront_rate numeric, _promo_code text, _instapay_reference text, _payment_proof_path text)
 RETURNS TABLE(id uuid, order_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_product_id uuid;
  v_product_starting_price numeric;
  v_product_is_active boolean;
  v_min_price numeric;
  v_line_total numeric;
  v_order_id uuid;
  v_order_number text;
  v_notes text;
  v_surcharge numeric;
  v_proof text := NULLIF(trim(COALESCE(_payment_proof_path, '')), '');
  v_promo_in text := NULLIF(trim(COALESCE(_promo_code, '')), '');
  v_upfront_rate CONSTANT numeric := 0.75;
  v_shipping_fee CONSTANT numeric := 1000;
BEGIN
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    IF (v_item->>'quantity')::int <= 0 OR (v_item->>'unit_price')::numeric < 0 THEN
      RAISE EXCEPTION 'Invalid line item';
    END IF;

    v_surcharge := COALESCE(NULLIF(v_item->>'custom_surcharge','')::numeric, 0);
    IF v_surcharge < 0 THEN
      RAISE EXCEPTION 'Custom surcharge cannot be negative';
    END IF;

    SELECT p.id, p.starting_price, p.is_active
      INTO v_product_id, v_product_starting_price, v_product_is_active
      FROM public.products p
     WHERE p.id = (v_item->>'product_id')::uuid;

    IF v_product_id IS NULL OR NOT v_product_is_active THEN
      RAISE EXCEPTION 'Product no longer available';
    END IF;

    v_min_price := v_product_starting_price + v_surcharge;

    IF (v_item->>'unit_price')::numeric < v_min_price THEN
      RAISE EXCEPTION 'Item price too low for %', v_item->>'product_name';
    END IF;

    v_line_total := (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  IF v_promo_in IS NOT NULL THEN
    SELECT vpc.id, vpc.code, vpc.discount_amount
      INTO v_promo_id, v_promo_code, v_discount
      FROM public.validate_promo_code(v_promo_in, v_subtotal) vpc
      LIMIT 1;
    IF v_promo_id IS NULL THEN
      RAISE EXCEPTION 'Promo code is invalid or expired';
    END IF;
    v_subtotal := v_subtotal - v_discount;
  END IF;

  v_upfront := round(v_subtotal * v_upfront_rate);
  v_total := v_subtotal + v_shipping_fee;
  v_remaining := (v_subtotal - v_upfront) + v_shipping_fee;
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
    v_subtotal, v_shipping_fee, v_total, v_upfront, v_remaining,
    'instapay', _instapay_reference, v_proof, v_notes
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
$function$;

DROP FUNCTION IF EXISTS public.create_order_with_items(jsonb, jsonb, numeric, numeric, text, text, text);