
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS instapay_reference text,
  ADD COLUMN IF NOT EXISTS payment_proof_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Payment proofs are publicly readable" ON storage.objects;
CREATE POLICY "Payment proofs are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');
