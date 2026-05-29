
-- 1. Restrict payment-proofs uploads: size + image MIME
DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
CREATE POLICY "Anyone can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND COALESCE((metadata ->> 'size')::bigint, 0) < 10485760
    AND COALESCE(metadata ->> 'mimetype', '') LIKE 'image/%'
  );

-- 2. Require auth for inspiration-images uploads
DROP POLICY IF EXISTS "Anyone can upload inspiration images" ON storage.objects;
CREATE POLICY "Authenticated users upload inspiration images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inspiration-images'
    AND auth.uid() IS NOT NULL
    AND COALESCE((metadata ->> 'size')::bigint, 0) < 5242880
    AND COALESCE(metadata ->> 'mimetype', '') LIKE 'image/%'
  );

-- 3. Remove direct INSERT on order_items; only the SECURITY DEFINER RPC may insert.
DROP POLICY IF EXISTS "Users create own order items" ON order_items;
