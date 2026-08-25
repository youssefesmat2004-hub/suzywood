REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (id, slug, category_id, name, tagline, description, starting_price, image_url, gallery, sizes, finishes, materials, safety_info, care_info, lead_time_weeks, is_featured, is_active, created_at, updated_at, stock_quantity, portable_changing_table_enabled, sale_price, sale_ends_at) ON public.products TO anon;

REVOKE SELECT ON public.product_variants FROM anon;
GRANT SELECT (id, product_id, name, price, stock_quantity, image_url, sort_order, is_active, created_at, updated_at, variant_type, color_hex, sale_price, sale_ends_at) ON public.product_variants TO anon;

REVOKE SELECT ON public.categories FROM anon;
GRANT SELECT (id, slug, name, description, sort_order, created_at, image_url, custom_size_enabled, custom_size_surcharge, custom_size_note, name_engraving_enabled, name_engraving_surcharge, name_engraving_note, finish_label, ottoman_addon_enabled, ottoman_addon_price, ottoman_addon_note, portable_changing_table_enabled, portable_changing_table_price, portable_changing_table_note, mattress_addon_enabled, mattress_small_price, mattress_big_price, mattress_addon_note, lights_addon_enabled, lights_addon_price, lights_addon_note) ON public.categories TO anon;