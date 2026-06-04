
-- 1) Lock down SECURITY DEFINER helpers from direct API calls.
-- These are only meant to be called by triggers or by other SECURITY DEFINER functions.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_admin_on_signup() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_promo_usage(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_instapay_qr_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_carpenter_order_update_scope() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;

-- Keep these callable by guests/users (used during checkout / order tracking).
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb, numeric, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_order_for_tracking(text, text) TO anon, authenticated;

-- 2) Add owner-notification dedupe columns so server fns can verify "just inserted" and claim atomically.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS owner_notification_sent_at timestamptz;
ALTER TABLE public.custom_build_requests
  ADD COLUMN IF NOT EXISTS owner_notification_sent_at timestamptz;

-- 3) Ensure Realtime publication does not broadcast PII tables.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='contact_messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_messages';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='custom_build_requests') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.custom_build_requests';
  END IF;
END $$;
