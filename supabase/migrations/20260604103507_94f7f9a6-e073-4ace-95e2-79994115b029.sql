
-- 1. Lock down promo_codes table reads (function is SECURITY DEFINER so it still works)
REVOKE SELECT ON public.promo_codes FROM anon, authenticated;

-- 2. Harden order tracking: require full phone, exact normalized equality
CREATE OR REPLACE FUNCTION public.lookup_order_for_tracking(_order_number text, _phone text)
 RETURNS TABLE(id uuid, order_number text, status order_status, customer_name text, total numeric, subtotal numeric, shipping_fee numeric, upfront_amount numeric, remaining_amount numeric, shipping_city text, shipping_governorate text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_phone_digits text;
BEGIN
  IF _phone IS NULL OR _order_number IS NULL THEN
    RETURN;
  END IF;
  v_phone_digits := regexp_replace(_phone, '[^0-9]', '', 'g');
  -- Require a full Egyptian-style phone number (at least 10 digits) and exact match.
  IF length(v_phone_digits) < 10 THEN
    RETURN;
  END IF;
  IF length(trim(_order_number)) < 8 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.id, o.order_number, o.status, o.customer_name, o.total, o.subtotal,
    o.shipping_fee, o.upfront_amount, o.remaining_amount,
    o.shipping_city, o.shipping_governorate, o.created_at
  FROM public.orders o
  WHERE o.order_number = _order_number
    AND regexp_replace(o.customer_phone, '[^0-9]', '', 'g') = v_phone_digits
  LIMIT 1;
END;
$function$;

-- 3. Remove sensitive tables (site_content, bookings) from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.site_content;
ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings;

-- 4. Idempotency flag for owner new-order notification email
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS owner_notification_sent_at timestamp with time zone;
