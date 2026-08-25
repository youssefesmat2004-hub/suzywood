ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS lights_addon_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lights_addon_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lights_addon_note text;

UPDATE public.categories
SET lights_addon_enabled = true,
    lights_addon_price = 300,
    lights_addon_note = 'Warm fairy lights to drape over your tent. Pompoms are sold separately.'
WHERE slug = 'play-safety';

UPDATE public.products
SET description = 'Enjoy some quality time with your little one inside our cozy and warm Teepee Tent!
Comes in only Off-white but the pompoms come in Navy, Kashmir, Off-white and Pink.

Please note: lights and pompoms are NOT included with the tent — they are available as extras at an additional cost. You can add fairy lights below for 300 EGP.'
WHERE slug = 'teepetent';

UPDATE public.products
SET description = 'This bundle includes one Teepee Tent (120 x 120, 160 cm height) in your choice of pompom colour, plus one Swing. A perfect pair for playtime and relaxation.

Please note: lights and pompoms are NOT included with the tent — they are available as extras at an additional cost. You can add fairy lights below for 300 EGP.'
WHERE slug = 'tent-swing-bundle';