CREATE OR REPLACE FUNCTION public.admin_products()
RETURNS SETOF public.products
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM public.products p
  WHERE public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'carpenter');
$$;

CREATE OR REPLACE FUNCTION public.admin_product_variants()
RETURNS SETOF public.product_variants
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.* FROM public.product_variants v
  WHERE public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'carpenter');
$$;

CREATE OR REPLACE FUNCTION public.admin_categories()
RETURNS SETOF public.categories
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.* FROM public.categories c
  WHERE public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'carpenter');
$$;

REVOKE ALL ON FUNCTION public.admin_products() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_product_variants() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_categories() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_products() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_product_variants() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_categories() TO authenticated, service_role;