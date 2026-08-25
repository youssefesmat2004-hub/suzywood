# Pompom colors on demand + 300 EGP add-ons

## What changes

1. **Pompom color picker is hidden by default.** On the Teepee Tent and the Tent + Swing Bundle, the color swatches only appear after the "Add Pompoms" box is checked. Unchecking it hides the swatches again and clears the selection.
2. **Both add-ons cost 300 EGP each.** Fairy Lights is already 300 EGP; Pompoms is currently set to 0 and will be set to 300 EGP. Both products sit in the same category, so the change applies to the tent and the bundle together.
3. Checking both add-ons adds 600 EGP to the item price, shown in the price breakdown and carried into the cart/order line as today.

## Notes

- The note under the color picker keeps saying the tent fabric is off-white only, but "included at no extra cost" is replaced with wording that reflects the 300 EGP pompom add-on (English and Arabic).
- Pompom colors remain optional: no pompoms checked means no color choice is required at checkout.

## Technical detail

- `src/routes/shop.$slug.tsx`: gate the pompom/fabric color block behind `pompomApplied` instead of `lightsEnabled`; reset the selected color state when the pompom toggle is switched off.
- Update the pompom labels in `src/lib/i18n/sections/shop.ts` (en + ar).
- Database: set `categories.pompom_addon_price = 300` for the `play-safety` category (applied via a migration).
