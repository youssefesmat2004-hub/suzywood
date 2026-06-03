## Goal
Stop showing the "Available in multiple finishes / sizes & finishes" label on product cards for: Cribs, Toddler Beds, Montessori Bed, Teepee Tents, and Drawers & Changing Tables.

## Change
In `src/components/site/ProductCard.tsx`, treat the finishes list as empty for these category slugs when deciding what label to render:

- `cribs`
- `kids-beds` (Toddler Beds)
- `montessori-bed`
- `play-safety` (Teepee Tents)
- `drawers-changing-tables`

Implementation: add a `HIDE_FINISHES_LABEL` set of slugs. When `product.category_slug` is in that set, compute a `displayFinishes` array as `[]` and use it only for the variant-label line — so:
- If sizes > 1 → label reads "Available in multiple sizes"
- If sizes ≤ 1 → the label line is not rendered at all

Cart behavior, quick-add, and actual finish options on the product page stay unchanged. Safety Gates path is untouched.

## Out of scope
No DB changes — product `finishes` data stays intact so the product detail page can still offer finish choices if configured. Only the card-level marketing label is suppressed for these categories.
