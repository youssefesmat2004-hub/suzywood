
-- 1) Lock down web_push_config: ensure no app role can read the VAPID private key.
-- RLS is already enabled with no policies, but revoke any table-level grants so the
-- secret is unreachable via the Data API even if a permissive policy is added later.
REVOKE ALL ON TABLE public.web_push_config FROM anon, authenticated;
GRANT ALL ON TABLE public.web_push_config TO service_role;

-- Belt-and-braces: explicit deny policies for anon/authenticated on SELECT.
DROP POLICY IF EXISTS "Deny all reads on web_push_config" ON public.web_push_config;
CREATE POLICY "Deny all reads on web_push_config"
  ON public.web_push_config
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- 2) Restrict Realtime broadcast for the 'orders' table to admins and carpenters.
-- Supabase Realtime Authorization checks realtime.messages policies for channel
-- subscribers. Add a SELECT policy that allows only admin / carpenter roles to
-- subscribe to order-related topics, blocking regular authenticated users from
-- receiving other customers' order data.
DROP POLICY IF EXISTS "Restrict orders realtime topic to staff" ON realtime.messages;
CREATE POLICY "Restrict orders realtime topic to staff"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    CASE
      WHEN realtime.topic() IN ('orders', 'admin-orders')
        OR realtime.topic() LIKE 'admin-order-%'
        OR realtime.topic() LIKE 'carpenter-orders-%'
      THEN public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_role(auth.uid(), 'carpenter'::public.app_role)
      ELSE true
    END
  );
