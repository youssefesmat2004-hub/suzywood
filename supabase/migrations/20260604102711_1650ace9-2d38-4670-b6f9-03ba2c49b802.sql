
CREATE OR REPLACE FUNCTION public.lookup_order_for_tracking(_order_number text, _phone text)
 RETURNS TABLE(id uuid, order_number text, status order_status, customer_name text, total numeric, subtotal numeric, shipping_fee numeric, upfront_amount numeric, remaining_amount numeric, shipping_city text, shipping_governorate text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _phone IS NULL OR length(regexp_replace(_phone, '[^0-9]', '', 'g')) < 4 THEN
    RETURN;
  END IF;
  IF _order_number IS NULL OR length(trim(_order_number)) < 4 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.id, o.order_number, o.status, o.customer_name, o.total, o.subtotal,
    o.shipping_fee, o.upfront_amount, o.remaining_amount,
    o.shipping_city, o.shipping_governorate, o.created_at
  FROM public.orders o
  WHERE o.order_number = _order_number
    AND regexp_replace(o.customer_phone, '[^0-9]', '', 'g')
      LIKE '%' || regexp_replace(_phone, '[^0-9]', '', 'g')
  LIMIT 1;
END;
$function$;
