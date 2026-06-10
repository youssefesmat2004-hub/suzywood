ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;