Run a single migration with the GRANTs and data fix you specified. No code changes.

## Migration SQL

```sql
-- 1. Restore has_role execute
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- 2. Restore public read access
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;

-- 3. Restore admin write access
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.product_variants TO authenticated;
GRANT ALL ON public.categories TO authenticated;
```

## Note on `is_visible`

The `products` table in this project does not have an `is_visible` column — visibility is controlled by `is_active`. I will skip the `UPDATE products SET is_visible = true` statement since the column does not exist (it would error). RLS already exposes rows where `is_active = true`, so no data update is needed. If you actually want to flip every product's `is_active` to true, say so and I'll add that.
