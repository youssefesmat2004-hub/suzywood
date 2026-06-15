ALTER TABLE public.custom_build_requests
  ADD COLUMN IF NOT EXISTS accepted_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_email_sent_at timestamptz;