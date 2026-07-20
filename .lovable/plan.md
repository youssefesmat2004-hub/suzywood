## Goal
Ensure every product and every variant (size/color) has at least 10 units in stock.

## Current state (verified)
- `products.stock_quantity < 10`: **0 rows**
- `product_variants.stock_quantity < 10`: **3 rows**

Products are already fine. Only 3 variant rows need bumping.

## Change
Run one data update via the insert tool:

```sql
UPDATE public.product_variants SET stock_quantity = 10 WHERE stock_quantity < 10;
UPDATE public.products         SET stock_quantity = 10 WHERE stock_quantity < 10;
```

The second statement is a safety net in case any product drops below 10 between now and execution.

## Notes
- This only raises stock where it's below 10; anything already ≥ 10 is untouched.
- No schema changes, no code changes.
- If you'd rather set a different floor (e.g. 20), say the number and I'll adjust.
