ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS pompom_addon_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pompom_addon_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pompom_addon_note text;

UPDATE public.categories
SET pompom_addon_enabled = true,
    pompom_addon_price = 0,
    pompom_addon_note = 'Handmade pompom garland in your chosen color. Tent fabric is off-white only.'
WHERE lights_addon_enabled = true;

GRANT SELECT (id, slug, name, description, sort_order, created_at, image_url, custom_size_enabled, custom_size_surcharge, custom_size_note, name_engraving_enabled, name_engraving_surcharge, name_engraving_note, finish_label, ottoman_addon_enabled, ottoman_addon_price, ottoman_addon_note, portable_changing_table_enabled, portable_changing_table_price, portable_changing_table_note, mattress_addon_enabled, mattress_small_price, mattress_big_price, mattress_addon_note, lights_addon_enabled, lights_addon_price, lights_addon_note, pompom_addon_enabled, pompom_addon_price, pompom_addon_note) ON public.categories TO anon;