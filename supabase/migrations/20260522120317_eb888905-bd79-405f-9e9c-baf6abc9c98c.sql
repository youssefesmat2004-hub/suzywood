
CREATE TABLE public.category_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  label text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_category_sizes_category ON public.category_sizes(category_id, sort_order);

ALTER TABLE public.category_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active sizes are public"
  ON public.category_sizes FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage category sizes"
  ON public.category_sizes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_category_sizes_updated_at
  BEFORE UPDATE ON public.category_sizes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.categories
  ADD COLUMN custom_size_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN custom_size_surcharge numeric NOT NULL DEFAULT 0,
  ADD COLUMN custom_size_note text;

ALTER TABLE public.order_items
  ADD COLUMN custom_width_cm numeric,
  ADD COLUMN custom_length_cm numeric,
  ADD COLUMN custom_surcharge numeric;

-- Seed existing category sizes from the previous hardcoded presets
INSERT INTO public.category_sizes (category_id, label, price, sort_order)
SELECT c.id, s.label, 0, s.ord
FROM public.categories c
JOIN (
  VALUES
    ('cribs', '120 x 60 cm', 1),
    ('cribs', '140 x 70 cm', 2),
    ('kids-beds', '100 x 200 cm', 1),
    ('kids-beds', '120 x 200 cm', 2),
    ('kids-beds', '140 x 200 cm', 3),
    ('play-safety', '120 x 120 cm — 160 cm Height', 1)
) AS s(slug, label, ord) ON s.slug = c.slug;
