ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS name_engraving_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS name_engraving_surcharge numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS name_engraving_note text,
  ADD COLUMN IF NOT EXISTS finish_label text;