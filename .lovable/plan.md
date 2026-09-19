# Fix the two items from the first check-up report

Both items come from the very first run of the check-up. They were already corrected
right after that run, and the second run passed all 44 checks. This plan confirms the
fixes and closes them out properly.

## 1. "All products have a price: Safety Gates"

Not a real problem. Safety Gates is deliberately priced after a home measurement visit,
so it has no fixed price and the page shows "Price upon measurement".

The check was wrong, not the product. It now only flags a product with a genuinely
missing price, and treats "priced after measurement" items as normal.

## 2. "Photo upload (custom builds): Bucket not found"

The check was looking in the wrong place for the customer photo storage, so the upload
test failed even though customer uploads were working fine.

It now points at the correct storage area used by the custom-build form, and the test
upload succeeds and cleans itself up.

## Confirmation

- Re-run the check-up once to confirm both items pass and a clean green report email
  arrives at both owner addresses.
- No changes to the storefront, admin panel, products or prices.

## Note

The scheduled run every 5 days calls the live published site, so publishing once makes
sure the automatic runs reach the latest version.
