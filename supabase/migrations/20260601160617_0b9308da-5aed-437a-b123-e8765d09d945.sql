ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS portable_changing_table_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portable_changing_table_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portable_changing_table_note text;

UPDATE public.categories
   SET portable_changing_table_enabled = true,
       portable_changing_table_price = 2000
 WHERE slug IN ('drawers-and-changing-tables', 'drawers-changing-tables', 'changing-tables', 'drawers');