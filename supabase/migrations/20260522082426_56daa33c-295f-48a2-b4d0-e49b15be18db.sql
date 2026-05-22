
ALTER TABLE public.custom_build_requests
ADD COLUMN IF NOT EXISTS inspiration_image_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('inspiration-images', 'inspiration-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Inspiration images are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspiration-images');

CREATE POLICY "Anyone can upload inspiration images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inspiration-images'
  AND (octet_length(COALESCE(metadata->>'size','0')::text) < 20)
);

CREATE POLICY "Admins delete inspiration images"
ON storage.objects FOR DELETE
USING (bucket_id = 'inspiration-images' AND has_role(auth.uid(), 'admin'::app_role));
