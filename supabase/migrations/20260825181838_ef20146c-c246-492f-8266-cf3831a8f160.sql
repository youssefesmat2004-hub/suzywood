ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS tagline_ar text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS materials_ar text,
  ADD COLUMN IF NOT EXISTS safety_info_ar text,
  ADD COLUMN IF NOT EXISTS care_info_ar text,
  ADD COLUMN IF NOT EXISTS sizes_ar jsonb,
  ADD COLUMN IF NOT EXISTS finishes_ar jsonb;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS finish_label_ar text,
  ADD COLUMN IF NOT EXISTS custom_size_note_ar text,
  ADD COLUMN IF NOT EXISTS name_engraving_note_ar text,
  ADD COLUMN IF NOT EXISTS ottoman_addon_note_ar text,
  ADD COLUMN IF NOT EXISTS portable_changing_table_note_ar text,
  ADD COLUMN IF NOT EXISTS mattress_addon_note_ar text,
  ADD COLUMN IF NOT EXISTS lights_addon_note_ar text,
  ADD COLUMN IF NOT EXISTS pompom_addon_note_ar text;

ALTER TABLE public.category_sizes
  ADD COLUMN IF NOT EXISTS label_ar text;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS name_ar text;

GRANT SELECT (name_ar, tagline_ar, description_ar, materials_ar, safety_info_ar, care_info_ar, sizes_ar, finishes_ar) ON public.products TO anon, authenticated;
GRANT UPDATE (name_ar, tagline_ar, description_ar, materials_ar, safety_info_ar, care_info_ar, sizes_ar, finishes_ar) ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT (name_ar, description_ar, finish_label_ar, custom_size_note_ar, name_engraving_note_ar, ottoman_addon_note_ar, portable_changing_table_note_ar, mattress_addon_note_ar, lights_addon_note_ar, pompom_addon_note_ar) ON public.categories TO anon, authenticated;
GRANT UPDATE (name_ar, description_ar, finish_label_ar, custom_size_note_ar, name_engraving_note_ar, ottoman_addon_note_ar, portable_changing_table_note_ar, mattress_addon_note_ar, lights_addon_note_ar, pompom_addon_note_ar) ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

GRANT SELECT (label_ar) ON public.category_sizes TO anon, authenticated;
GRANT UPDATE (label_ar) ON public.category_sizes TO authenticated;
GRANT ALL ON public.category_sizes TO service_role;

GRANT SELECT (name_ar) ON public.product_variants TO anon, authenticated;
GRANT UPDATE (name_ar) ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;