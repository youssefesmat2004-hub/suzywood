
-- Status enum for measurement bookings
CREATE TYPE public.measurement_booking_status AS ENUM ('new','contacted','visited','quoted','ordered','cancelled');

CREATE TABLE public.measurement_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid,
  product_name text NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  area text NOT NULL,
  address text NOT NULL,
  preferred_day text NOT NULL,
  time_slot text NOT NULL,
  notes text,
  status public.measurement_booking_status NOT NULL DEFAULT 'new',
  quoted_price numeric,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.measurement_bookings TO authenticated;
GRANT INSERT ON public.measurement_bookings TO anon;
GRANT ALL ON public.measurement_bookings TO service_role;

ALTER TABLE public.measurement_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create measurement booking"
ON public.measurement_bookings
FOR INSERT
WITH CHECK (
  char_length(full_name) BETWEEN 1 AND 100
  AND phone ~ '^01[0-9]{9}$'
  AND char_length(area) BETWEEN 1 AND 50
  AND char_length(address) BETWEEN 3 AND 500
  AND preferred_day = ANY (ARRAY['saturday','sunday','monday','tuesday','wednesday','thursday'])
  AND time_slot = ANY (ARRAY['morning','afternoon','evening'])
  AND char_length(product_name) BETWEEN 1 AND 200
  AND (notes IS NULL OR char_length(notes) <= 2000)
  AND status = 'new'
  AND quoted_price IS NULL
);

CREATE POLICY "Admins view measurement bookings"
ON public.measurement_bookings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update measurement bookings"
ON public.measurement_bookings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_measurement_bookings_updated_at
BEFORE UPDATE ON public.measurement_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
