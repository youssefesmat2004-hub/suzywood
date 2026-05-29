## Problem

When submitting the order, Postgres throws `column reference "id" is ambiguous`. The error surfaces to the user as "reference number is ambiguous" via the toast description.

## Root cause

`create_order_with_items` declares `RETURNS TABLE(id uuid, order_number text)`. Those become OUT parameters named `id` and `order_number` inside the function body. Inside the loop:

```sql
SELECT id, starting_price, is_active
  INTO v_product
  FROM public.products
 WHERE id = (v_item->>'product_id')::uuid;
```

Both `id` in the SELECT list and `id` in the WHERE clause are ambiguous between the OUT parameter `id` and `products.id`. Postgres rejects the call before any order row is created.

## Fix

Create a new migration that replaces `create_order_with_items` with a version where every column reference is fully qualified:

- `SELECT products.id, products.starting_price, products.is_active ... WHERE products.id = ...`
- Also qualify the final assignments (`id := v_order_id; order_number := v_order_number;`) — these are fine but keep clean.
- No other behavior changes: 75% upfront rate, promo handling, line totals, insert into `orders` + `order_items` all stay identical.

No client code changes needed; signature stays the same.

## Files

- New: `supabase/migrations/<timestamp>_fix_create_order_ambiguous.sql` — `CREATE OR REPLACE FUNCTION public.create_order_with_items(...)` with qualified column references.

## Verification

After applying, retry checkout end-to-end with a real cart + reference number. Order should be created and the thank-you page should load.
