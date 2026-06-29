
-- Carpenter cost & profit tracking
ALTER TABLE public.products         ADD COLUMN IF NOT EXISTS carpenter_cost NUMERIC DEFAULT 0;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS carpenter_cost NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carpenter_cost_override   NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS actual_carpenter_cost     NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carpenter_payment_status  TEXT DEFAULT 'unpaid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carpenter_paid_at         TIMESTAMPTZ;

-- Extend carpenter update-scope trigger so carpenters cannot touch new financial cols.
CREATE OR REPLACE FUNCTION public.enforce_carpenter_order_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'carpenter') THEN
    IF NEW.customer_name      IS DISTINCT FROM OLD.customer_name
    OR NEW.customer_email     IS DISTINCT FROM OLD.customer_email
    OR NEW.customer_phone     IS DISTINCT FROM OLD.customer_phone
    OR NEW.shipping_address   IS DISTINCT FROM OLD.shipping_address
    OR NEW.shipping_city      IS DISTINCT FROM OLD.shipping_city
    OR NEW.shipping_governorate IS DISTINCT FROM OLD.shipping_governorate
    OR NEW.shipping_notes     IS DISTINCT FROM OLD.shipping_notes
    OR NEW.subtotal           IS DISTINCT FROM OLD.subtotal
    OR NEW.shipping_fee       IS DISTINCT FROM OLD.shipping_fee
    OR NEW.total              IS DISTINCT FROM OLD.total
    OR NEW.upfront_amount     IS DISTINCT FROM OLD.upfront_amount
    OR NEW.remaining_amount   IS DISTINCT FROM OLD.remaining_amount
    OR NEW.payment_method     IS DISTINCT FROM OLD.payment_method
    OR NEW.instapay_reference IS DISTINCT FROM OLD.instapay_reference
    OR NEW.payment_proof_url  IS DISTINCT FROM OLD.payment_proof_url
    OR NEW.internal_notes     IS DISTINCT FROM OLD.internal_notes
    OR NEW.order_number       IS DISTINCT FROM OLD.order_number
    OR NEW.user_id            IS DISTINCT FROM OLD.user_id
    OR NEW.assigned_carpenter IS DISTINCT FROM OLD.assigned_carpenter
    OR NEW.confirmation_email_sent_at IS DISTINCT FROM OLD.confirmation_email_sent_at
    OR NEW.carpenter_cost_override    IS DISTINCT FROM OLD.carpenter_cost_override
    OR NEW.actual_carpenter_cost      IS DISTINCT FROM OLD.actual_carpenter_cost
    OR NEW.carpenter_payment_status   IS DISTINCT FROM OLD.carpenter_payment_status
    OR NEW.carpenter_paid_at          IS DISTINCT FROM OLD.carpenter_paid_at
    THEN
      RAISE EXCEPTION 'Carpenters may only update order status';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- RPC: carpenter-safe view of their own owed orders. No selling price, no profit.
CREATE OR REPLACE FUNCTION public.get_carpenter_owed_orders(_carpenter_id smallint)
RETURNS TABLE(
  order_id uuid,
  order_number text,
  product_summary text,
  carpenter_cost numeric,
  payment_status text,
  paid_at timestamptz,
  status public.order_status,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins or carpenters may call. Carpenters can only see their own id.
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'carpenter')) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    COALESCE((
      SELECT string_agg(oi.product_name || CASE WHEN oi.quantity > 1 THEN ' ×' || oi.quantity ELSE '' END, ', ')
      FROM public.order_items oi WHERE oi.order_id = o.id
    ), '') AS product_summary,
    COALESCE(o.actual_carpenter_cost, 0) AS carpenter_cost,
    COALESCE(o.carpenter_payment_status, 'unpaid') AS payment_status,
    o.carpenter_paid_at,
    o.status,
    o.created_at
  FROM public.orders o
  WHERE o.assigned_carpenter = _carpenter_id
    AND o.status <> 'cancelled';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_carpenter_owed_orders(smallint) TO authenticated;
