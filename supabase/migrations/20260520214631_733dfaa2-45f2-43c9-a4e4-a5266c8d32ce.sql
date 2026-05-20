
-- 1. Add is_read flag to contact_messages
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- 2. Admin update + delete policies for contact_messages
DROP POLICY IF EXISTS "Admins update messages" ON public.contact_messages;
CREATE POLICY "Admins update messages"
  ON public.contact_messages
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete messages" ON public.contact_messages;
CREATE POLICY "Admins delete messages"
  ON public.contact_messages
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Admin delete policy for custom_build_requests
DROP POLICY IF EXISTS "Admins delete custom requests" ON public.custom_build_requests;
CREATE POLICY "Admins delete custom requests"
  ON public.custom_build_requests
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Enable realtime
ALTER TABLE public.contact_messages REPLICA IDENTITY FULL;
ALTER TABLE public.custom_build_requests REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'contact_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'custom_build_requests'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_build_requests';
  END IF;
END $$;
