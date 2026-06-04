
-- 1) Remove direct INSERT on orders; force creation via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;

-- 2) Tighten payment-proofs upload: restrict to UUID-named image files,
--    drop the unrestricted anonymous policy and replace with a constrained one.
DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;

CREATE POLICY "Constrained payment proof uploads"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
);
