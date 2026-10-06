DO $mig$
DECLARE d text; n text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO d FROM pg_proc p
   WHERE p.proname='create_order_with_items' AND p.pronargs=8 AND p.pronamespace='public'::regnamespace;
  n := regexp_replace(d, 'v_shipping_fee\s*:=\s*CASE\s+v_area',
$r$IF v_area = 'pickup-maadi' AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(_items) e
      JOIN public.products p2 ON p2.id = (e->>'product_id')::uuid
      JOIN public.categories c2 ON c2.id = p2.category_id
     WHERE c2.slug NOT IN ('swings','play-safety')) THEN
    RAISE EXCEPTION 'Free pickup from Maadi is only available for tents and swings';
  END IF;

  v_shipping_fee := CASE v_area
    WHEN 'pickup-maadi' THEN 0$r$);
  IF n = d THEN RAISE EXCEPTION 'pattern not found'; END IF;
  EXECUTE n;
END
$mig$;