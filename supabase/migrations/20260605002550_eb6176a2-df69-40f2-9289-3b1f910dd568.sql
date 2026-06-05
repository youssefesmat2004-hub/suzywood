GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;

GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.product_variants TO authenticated;
GRANT ALL ON public.categories TO authenticated;