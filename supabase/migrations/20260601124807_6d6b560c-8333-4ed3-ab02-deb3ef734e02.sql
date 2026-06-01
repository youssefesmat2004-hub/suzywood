ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS variant_type text NOT NULL DEFAULT 'size',
  ADD COLUMN IF NOT EXISTS color_hex text;

ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS product_variants_variant_type_check;

ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_variant_type_check
  CHECK (variant_type IN ('size','fabric_color'));

ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS product_variants_color_hex_check;

ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_color_hex_check
  CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$');