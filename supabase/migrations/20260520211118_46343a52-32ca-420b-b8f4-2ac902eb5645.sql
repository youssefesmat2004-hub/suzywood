CREATE TYPE public.booking_status AS ENUM ('new', 'contacted', 'done');
CREATE TYPE public.booking_contact_method AS ENUM ('whatsapp', 'phone');
CREATE TYPE public.booking_day AS ENUM ('saturday','sunday','monday','tuesday','wednesday','thursday');
CREATE TYPE public.booking_time_slot AS ENUM ('morning','afternoon','evening');

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  contact_method public.booking_contact_method NOT NULL,
  preferred_day public.booking_day NOT NULL,
  time_slot public.booking_time_slot NOT NULL,
  notes text,
  status public.booking_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create booking"
  ON public.bookings FOR INSERT
  WITH CHECK (
    char_length(full_name) BETWEEN 1 AND 100
    AND phone ~ '^01[0-9]{9}$'
    AND (notes IS NULL OR char_length(notes) <= 2000)
    AND status = 'new'
  );

CREATE POLICY "Admins view bookings"
  ON public.bookings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update bookings"
  ON public.bookings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;