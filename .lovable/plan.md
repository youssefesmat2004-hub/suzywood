# Add "Add Pompoms" option to the Teepee Tent and the Tent + Swing Bundle

Today the tent pages show a color swatch row (recently relabeled "Pompom Color") but there is no way for a customer to actually *add* pompoms to the order — only fairy lights have an add-on toggle. This adds a proper pompom add-on that works exactly like the fairy lights one.

## What the customer sees

On the Teepee Tent and the Tent + Swing Bundle product pages:

- A new checkbox/toggle: **Add pompoms** with its price (or "Price on request" while the price is 0), plus a short note.
- The pompom color swatches stay on the page and are used to pick the pompom color; the note stays clear that the tent fabric is off-white only.
- When toggled on, the pompom price is added to the item price, and the cart / checkout line reads e.g. `The Teepee Tent — Baby Blue · Fairy Lights · Pompoms`.

## What you control in the admin panel

In Admin → Categories, the Tent category gets the same three fields the fairy lights add-on already has:

- Pompoms add-on enabled (on/off)
- Pompoms price (EGP) — set to 0 for now, you can enter the real price any time and it appears on the site instantly
- Pompoms note (optional text shown under the option)

## Technical details

1. Migration: add `pompom_addon_enabled boolean not null default false`, `pompom_addon_price numeric not null default 0`, `pompom_addon_note text` to `public.categories`; re-issue the column-level `GRANT SELECT (...) ON public.categories TO anon` to include the three new columns (the existing grant is column-scoped, so new columns are invisible to the storefront without this). Enable the add-on for the tent category (price 0) so it shows on both the tent and the bundle.
2. `src/routes/shop.$slug.tsx`: extend the category `select` list and loader/component types, add `pompomEnabled` / `pompomPrice` / `withPompoms` state mirroring the lights block, include it in the unit-price sum, name suffix, `size` key and `sizeLabel` for the cart line, and render the toggle next to the fairy-lights toggle.
3. `src/routes/admin.categories.tsx`: add the three fields to the category type, defaults, save payload, and the add-ons form section, mirroring the lights fields.
4. `src/lib/i18n/sections/shop.ts`: add EN + AR strings for the pompom option label and note.
5. Regenerate/extend `src/integrations/supabase/types.ts` for the new category columns.
