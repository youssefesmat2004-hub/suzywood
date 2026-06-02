-- 1. Column
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS assigned_carpenter smallint
  CHECK (assigned_carpenter IS NULL OR assigned_carpenter BETWEEN 1 AND 3);

CREATE INDEX IF NOT EXISTS idx_orders_assigned_carpenter
  ON public.orders (assigned_carpenter)
  WHERE assigned_carpenter IS NOT NULL;

-- 2. Update the carpenter update-scope trigger to also block assignment changes
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
    THEN
      RAISE EXCEPTION 'Carpenters may only update order status';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;