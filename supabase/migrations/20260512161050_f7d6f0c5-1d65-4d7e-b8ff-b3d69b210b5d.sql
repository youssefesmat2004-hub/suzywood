ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS upfront_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC;