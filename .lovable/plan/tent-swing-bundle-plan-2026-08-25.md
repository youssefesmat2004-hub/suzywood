# Tent + Swing Bundle Plan

## Goal
Add a permanent "Tent + Swing Bundle" offer at EGP 4,750 and feature it on the homepage.

## Approach
Create a new standalone product that represents the bundle. The product page reuses the existing `/shop/$slug` flow, so customers pick the Tent size/fabric before adding to cart. The Swing is included as a fixed item (it has no variants).

## Steps

1. **Create the bundle product**
   - Insert a new row into `products`:
     - `name`: "Tent + Swing Bundle"
     - `slug`: `tent-swing-bundle`
     - `starting_price`: 4750
     - `category_id`: the existing Teepee Tent category
     - `is_active`: true, `is_featured`: true
     - `stock_quantity`: 10
     - `description`: clearly states the bundle includes one Teepee Tent (chosen size/color) and one Swing.
   - Use the existing Teepee Tent hero image as the bundle image, or generate a composite bundle image if preferred.

2. **Add bundle variants for Tent options**
   - The Teepee Tent currently has one size (120 x 120, 160 height) and four fabric colors (Navy Blue, Kashmir, Off-White, Pink).
   - Insert one `product_variants` row per color, all with:
     - `variant_type`: `bundle_option`
     - `name`: e.g., "120x120 / Off-White"
     - `price`: 4750
     - `stock_quantity`: 10
     - `is_active`: true
   - This lets the customer choose the Tent color on the bundle product page.

3. **Homepage promotion**
   - Add the bundle as the first item in the "Featured" section on the homepage, or add a dedicated "Bundle & Save" block above the current featured grid.
   - Include a badge such as "Bundle & Save" and show the original combined price (EGP 5,000 during the Tent sale, or EGP 6,250 at full price) with the bundle price of EGP 4,750.

4. **Inventory note**
   - The bundle will have its own stock counter (initially 10). Decrementing both the Tent and Swing stocks automatically when a bundle order is placed is out of scope for this plan; stock can be managed manually or addressed in a follow-up.

## Technical details
- SQL: `INSERT INTO products (...)` and `INSERT INTO product_variants (...)` for the bundle rows.
- No new routes needed; the bundle uses `/shop/tent-swing-bundle` automatically.
- `src/routes/index.tsx`: add the bundle product to the featured grid or create a new dedicated section.
- `src/components/site/ProductCard.tsx`: already supports sale/active-price display; the bundle card can show a "Bundle & Save" badge.

## Open question
Do you want the bundle card to compare against the current Tent sale price (EGP 2,500 + Swing EGP 2,500 = EGP 5,000, saving EGP 500) or the original full prices (EGP 3,750 + EGP 2,500 = EGP 6,250, saving EGP 1,500)?