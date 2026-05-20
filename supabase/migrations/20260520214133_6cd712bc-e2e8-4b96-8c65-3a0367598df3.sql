
DROP POLICY IF EXISTS "Public order tracking" ON public.orders;

CREATE OR REPLACE FUNCTION public.lookup_order_for_tracking(_order_number TEXT, _phone TEXT)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  status order_status,
  customer_name TEXT,
  total NUMERIC,
  subtotal NUMERIC,
  shipping_fee NUMERIC,
  upfront_amount NUMERIC,
  remaining_amount NUMERIC,
  shipping_city TEXT,
  shipping_governorate TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id, o.order_number, o.status, o.customer_name, o.total, o.subtotal,
    o.shipping_fee, o.upfront_amount, o.remaining_amount,
    o.shipping_city, o.shipping_governorate, o.created_at
  FROM public.orders o
  WHERE o.order_number = _order_number
    AND regexp_replace(o.customer_phone, '[^0-9]', '', 'g')
      LIKE '%' || regexp_replace(_phone, '[^0-9]', '', 'g')
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_order_for_tracking(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_for_tracking(TEXT, TEXT) TO anon, authenticated;
