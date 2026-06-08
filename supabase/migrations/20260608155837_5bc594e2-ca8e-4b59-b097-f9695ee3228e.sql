ALTER TABLE public.measurement_bookings ADD COLUMN IF NOT EXISTS owner_notification_sent_at TIMESTAMPTZ;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS owner_notification_sent_at TIMESTAMPTZ;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS owner_notification_sent_at TIMESTAMPTZ;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS owner_notification_sent_at TIMESTAMPTZ;