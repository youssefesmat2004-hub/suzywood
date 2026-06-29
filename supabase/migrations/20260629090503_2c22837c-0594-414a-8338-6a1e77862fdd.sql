
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ;

-- Storage policies for manual-order-attachments bucket
DROP POLICY IF EXISTS "manual_attach_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "manual_attach_carpenter_select" ON storage.objects;
DROP POLICY IF EXISTS "manual_attach_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "manual_attach_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "manual_attach_admin_delete" ON storage.objects;

CREATE POLICY "manual_attach_admin_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'manual-order-attachments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "manual_attach_carpenter_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'manual-order-attachments' AND public.has_role(auth.uid(), 'carpenter'));

CREATE POLICY "manual_attach_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'manual-order-attachments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "manual_attach_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'manual-order-attachments' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'manual-order-attachments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "manual_attach_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'manual-order-attachments' AND public.has_role(auth.uid(), 'admin'));
