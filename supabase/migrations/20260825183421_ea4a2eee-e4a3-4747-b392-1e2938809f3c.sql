-- Products
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, slug, category_id, name, name_ar, tagline, tagline_ar, description, description_ar,
  starting_price, image_url, gallery, sizes, sizes_ar, finishes, finishes_ar, materials, materials_ar,
  safety_info, safety_info_ar, care_info, care_info_ar, lead_time_weeks, is_featured, is_active,
  created_at, updated_at, stock_quantity, portable_changing_table_enabled, sale_price, sale_ends_at)
  ON public.products TO anon, authenticated;

-- Product variants
REVOKE SELECT ON public.product_variants FROM anon, authenticated;
GRANT SELECT (id, product_id, name, name_ar, price, stock_quantity, image_url, sort_order, is_active,
  created_at, updated_at, variant_type, color_hex, sale_price, sale_ends_at)
  ON public.product_variants TO anon, authenticated;

-- Categories
REVOKE SELECT ON public.categories FROM anon, authenticated;
GRANT SELECT (id, slug, name, name_ar, description, description_ar, sort_order, created_at, image_url,
  custom_size_enabled, custom_size_surcharge, custom_size_note, custom_size_note_ar,
  name_engraving_enabled, name_engraving_surcharge, name_engraving_note, name_engraving_note_ar,
  finish_label, finish_label_ar,
  ottoman_addon_enabled, ottoman_addon_price, ottoman_addon_note, ottoman_addon_note_ar,
  portable_changing_table_enabled, portable_changing_table_price, portable_changing_table_note, portable_changing_table_note_ar,
  mattress_addon_enabled, mattress_small_price, mattress_big_price, mattress_addon_note, mattress_addon_note_ar,
  lights_addon_enabled, lights_addon_price, lights_addon_note, lights_addon_note_ar,
  pompom_addon_enabled, pompom_addon_price, pompom_addon_note, pompom_addon_note_ar)
  ON public.categories TO anon, authenticated;

GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.product_variants TO service_role;
GRANT ALL ON public.categories TO service_role;