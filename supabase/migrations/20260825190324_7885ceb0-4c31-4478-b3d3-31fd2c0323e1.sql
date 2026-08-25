ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS lights_addon_carpenter_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pompom_addon_carpenter_cost numeric NOT NULL DEFAULT 0;

GRANT SELECT, INSERT, UPDATE (lights_addon_carpenter_cost, pompom_addon_carpenter_cost) ON public.categories TO authenticated;
GRANT ALL (lights_addon_carpenter_cost, pompom_addon_carpenter_cost) ON public.categories TO service_role;