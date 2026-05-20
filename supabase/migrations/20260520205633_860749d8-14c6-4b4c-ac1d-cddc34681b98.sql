-- Allow carpenters to view all orders
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders"
ON public.orders FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'carpenter'::app_role)
);

-- Allow carpenters to update order status
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Staff update orders"
ON public.orders FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'carpenter'::app_role)
);

-- Allow carpenters to view order items
DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
CREATE POLICY "Users view own order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'carpenter'::app_role)
      )
  )
);
