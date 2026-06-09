
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS customer_email TEXT NULL,
  ADD COLUMN IF NOT EXISTS customer_notification_sent_at TIMESTAMPTZ NULL;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_customer_email_len_chk
    CHECK (customer_email IS NULL OR char_length(customer_email) BETWEEN 3 AND 254);

ALTER TABLE public.measurement_bookings
  ADD COLUMN IF NOT EXISTS customer_email TEXT NULL,
  ADD COLUMN IF NOT EXISTS customer_notification_sent_at TIMESTAMPTZ NULL;

ALTER TABLE public.measurement_bookings
  ADD CONSTRAINT measurement_bookings_customer_email_len_chk
    CHECK (customer_email IS NULL OR char_length(customer_email) BETWEEN 3 AND 254);
