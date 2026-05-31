
-- =====================================================
-- 1. SECURITY DEFINER FUNCTIONS: Lock down EXECUTE grants
-- =====================================================

-- Trigger functions: no one should call them directly
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_admin_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_carpenter_order_update_scope() FROM PUBLIC, anon, authenticated;

-- Internal helper used only by create_order_with_items (SECURITY DEFINER chain)
REVOKE EXECUTE ON FUNCTION public.increment_promo_usage(uuid) FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS USING() — evaluated server-side, no direct EXECUTE needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- validate_promo_code: called from checkout (guest + signed-in)
REVOKE EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO anon, authenticated;

-- create_order_with_items: guest checkout allowed
REVOKE EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb, numeric, numeric, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb, numeric, numeric, text, text, text) TO anon, authenticated;

-- lookup_order_for_tracking: guests track by order# + phone
REVOKE EXECUTE ON FUNCTION public.lookup_order_for_tracking(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_for_tracking(text, text) TO anon, authenticated;

-- =====================================================
-- 2. STORAGE: file size limits + remove broad listing
-- =====================================================

-- Per-bucket size limits (bytes)
UPDATE storage.buckets SET file_size_limit = 5 * 1024 * 1024 WHERE id = 'product-images';
UPDATE storage.buckets SET file_size_limit = 5 * 1024 * 1024 WHERE id = 'inspiration-images';
UPDATE storage.buckets SET file_size_limit = 3 * 1024 * 1024 WHERE id = 'payment-proofs';

-- Drop any broad public SELECT policies on storage.objects for the public buckets.
-- Files remain reachable via their direct public CDN URL, but the bucket can
-- no longer be enumerated/listed.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    -- Drop policies whose name suggests broad public read for the public buckets
    IF pol.policyname ILIKE '%product-images%public%'
       OR pol.policyname ILIKE '%inspiration-images%public%'
       OR pol.policyname ILIKE '%public%read%product%'
       OR pol.policyname ILIKE '%public%read%inspiration%'
       OR pol.policyname = 'Product images are publicly accessible'
       OR pol.policyname = 'Inspiration images are publicly accessible'
       OR pol.policyname = 'Public can view product images'
       OR pol.policyname = 'Public can view inspiration images'
    THEN
      EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- 3. REALTIME: restrict channel subscriptions
-- =====================================================

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can subscribe to any topic" ON realtime.messages;
DROP POLICY IF EXISTS "Carpenters can subscribe to order topics" ON realtime.messages;

-- Admins: any topic
CREATE POLICY "Admins can subscribe to any topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Carpenters: only order-related back-office channels
CREATE POLICY "Carpenters can subscribe to order topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'carpenter')
  AND realtime.topic() IN ('admin-orders', 'orders')
);

-- Anonymous users get no policy → cannot subscribe to anything.

-- =====================================================
-- 4. ORDER_ITEMS INSERT: explicit policy denying direct inserts
-- =====================================================
-- order_items currently has NO insert policy, so direct inserts via PostgREST
-- are already blocked. The only insert path is create_order_with_items
-- (SECURITY DEFINER), which validates ownership + prices. We keep it that way
-- and add an explicit deny-by-default comment policy for clarity.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='order_items' AND cmd='INSERT'
  ) THEN
    -- Intentionally no INSERT policy: direct inserts denied. RPC-only path.
    NULL;
  END IF;
END $$;
