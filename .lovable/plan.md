# Fix "Kashmir" → "Cashmere"

The misspelling lives in the catalog data, not the code (a code search found no matches).

## What changes

- Rename the pompom color option from "Kashmir" to "Cashmere" on both products that offer it (The Teepee Tent and the Tent + Swing Bundle) — two color rows in total.
- Update the Teepee Tent description text, which currently reads "the pompoms come in Navy, Kashmir, Off-white and Pink", so it says "Cashmere".

## Technical notes

Data-only update: rename the two `product_variants` rows named "Kashmir" and replace the word inside the `products.description` for the `teepetent` product. No component or schema changes needed; the storefront reads these values directly.
