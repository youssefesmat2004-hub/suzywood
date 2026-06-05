ALTER TABLE public.custom_build_requests ADD COLUMN IF NOT EXISTS owner_notification_sent_at timestamptz;

CREATE POLICY "Users view own measurement bookings"
  ON public.measurement_bookings
  FOR SELECT
  USING (auth.uid() = user_id);