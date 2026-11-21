ALTER FUNCTION public.create_order_with_items(jsonb, jsonb, numeric, text, text, text, text, text)
  RENAME TO create_order_with_items_before_price_hold;

CREATE FUNCTION public.create_order_with_items(
  _details jsonb,
  _items jsonb,
  _upfront_rate numeric,
  _promo_code text,
  _instapay_reference text,
  _payment_proof_path text,
  _delivery_area text DEFAULT NULL::text,
  _order_size_type text DEFAULT 'big'::text
)
RETURNS TABLE(id uuid, order_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(_items, '[]'::jsonb)) AS item
    LEFT JOIN public.products p
      ON p.id = (item->>'product_id')::uuid
    WHERE p.id IS NULL
       OR p.slug NOT IN ('teepetent', 'tent-swing-bundle', 'theswing', 'therocker')
  ) THEN
    RAISE EXCEPTION 'Ordering is temporarily paused for one or more items in this cart. Only the teepee tent, tent + swing bundle, swing, and rocking chair are currently available.';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.create_order_with_items_before_price_hold(
    _details,
    _items,
    _upfront_rate,
    _promo_code,
    _instapay_reference,
    _payment_proof_path,
    _delivery_area,
    _order_size_type
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.create_order_with_items_before_price_hold(jsonb, jsonb, numeric, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items_before_price_hold(jsonb, jsonb, numeric, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb, numeric, text, text, text, text, text) TO anon, authenticated, service_role;