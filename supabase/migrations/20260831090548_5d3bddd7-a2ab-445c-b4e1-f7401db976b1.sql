REVOKE SELECT (name_engraving_carpenter_cost) ON public.categories FROM authenticated, anon;
REVOKE SELECT (lights_addon_carpenter_cost, pompom_addon_carpenter_cost) ON public.categories FROM authenticated, anon;
REVOKE SELECT (carpenter_cost) ON public.products FROM authenticated, anon;
REVOKE SELECT (carpenter_cost) ON public.product_variants FROM authenticated, anon;