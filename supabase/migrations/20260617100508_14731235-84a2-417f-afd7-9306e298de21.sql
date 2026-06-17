ALTER TABLE public.measurement_bookings ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.measurement_bookings ADD COLUMN IF NOT EXISTS quotation_price numeric;
ALTER TABLE public.measurement_bookings ADD COLUMN IF NOT EXISTS payment_link text;
ALTER TABLE public.measurement_bookings ADD COLUMN IF NOT EXISTS booking_status text NOT NULL DEFAULT 'received';
ALTER TABLE public.measurement_bookings ADD COLUMN IF NOT EXISTS confirmed_date timestamptz;
ALTER TABLE public.measurement_bookings ADD COLUMN IF NOT EXISTS received_email_sent_at timestamptz;
ALTER TABLE public.measurement_bookings ADD COLUMN IF NOT EXISTS confirmed_email_sent_at timestamptz;
ALTER TABLE public.measurement_bookings ADD COLUMN IF NOT EXISTS quotation_email_sent_at timestamptz;
ALTER TABLE public.measurement_bookings ADD COLUMN IF NOT EXISTS payment_email_sent_at timestamptz;

-- Replace insert policy to require email and allow new starting status
DROP POLICY IF EXISTS "Anyone can create measurement booking" ON public.measurement_bookings;
CREATE POLICY "Anyone can create measurement booking"
ON public.measurement_bookings
FOR INSERT
WITH CHECK (
  char_length(full_name) BETWEEN 1 AND 100
  AND phone ~ '^01[0-9]{9}$'
  AND customer_email IS NOT NULL
  AND customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(area) BETWEEN 1 AND 50
  AND char_length(address) BETWEEN 3 AND 500
  AND preferred_day = ANY (ARRAY['saturday','sunday','monday','tuesday','wednesday','thursday'])
  AND time_slot = ANY (ARRAY['morning','afternoon','evening'])
  AND char_length(product_name) BETWEEN 1 AND 200
  AND (notes IS NULL OR char_length(notes) <= 2000)
  AND status = 'new'
  AND quoted_price IS NULL
  AND booking_status = 'received'
);