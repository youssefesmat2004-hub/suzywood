ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_manual_order BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_description TEXT;