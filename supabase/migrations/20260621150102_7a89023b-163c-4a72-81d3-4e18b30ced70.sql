
-- 1) Remove the duplicate unconstrained INSERT policy on measurement_bookings.
--    The remaining "Anyone can create measurement booking" policy keeps full field validation.
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.measurement_bookings;

-- 2) Tighten payment-proofs uploads: authenticated users only, file path bound to their user id.
DROP POLICY IF EXISTS "Constrained payment proof uploads" ON storage.objects;

CREATE POLICY "Authenticated users upload own payment proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
  AND name ~ ('^' || auth.uid()::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$')
);
