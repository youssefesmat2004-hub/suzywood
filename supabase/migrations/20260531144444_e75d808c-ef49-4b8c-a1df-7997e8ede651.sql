
-- 1. Audit log table
CREATE TABLE public.instapay_qr_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  changed_by UUID,
  changed_by_email TEXT,
  previous_url TEXT,
  new_url TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.instapay_qr_log TO authenticated;
GRANT ALL ON public.instapay_qr_log TO service_role;

ALTER TABLE public.instapay_qr_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view qr log"
  ON public.instapay_qr_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- (No INSERT/UPDATE/DELETE policies — only the SECURITY DEFINER trigger writes here.)

-- 2. Trigger function to log QR changes on site_content
CREATE OR REPLACE FUNCTION public.log_instapay_qr_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF NEW.key <> 'instapay_qr_url' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.value IS NOT DISTINCT FROM OLD.value THEN
    RETURN NEW;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.instapay_qr_log (changed_by, changed_by_email, previous_url, new_url)
  VALUES (
    auth.uid(),
    v_email,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.value ELSE NULL END,
    NEW.value
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_instapay_qr_change ON public.site_content;
CREATE TRIGGER trg_log_instapay_qr_change
  AFTER INSERT OR UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.log_instapay_qr_change();

-- 3. Storage policies: lock /instapay/ folder in product-images to admin writes
DROP POLICY IF EXISTS "Admins manage instapay qr files" ON storage.objects;
CREATE POLICY "Admins manage instapay qr files"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'instapay'
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'instapay'
    AND public.has_role(auth.uid(), 'admin')
  );
