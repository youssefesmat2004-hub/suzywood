ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS ottoman_addon_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ottoman_addon_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ottoman_addon_note text;

UPDATE public.categories
   SET ottoman_addon_enabled = true
 WHERE slug IN ('nursing-chair', 'nursing-chairs');