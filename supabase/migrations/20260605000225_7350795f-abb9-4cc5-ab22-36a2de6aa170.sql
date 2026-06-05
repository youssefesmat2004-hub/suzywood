
-- Public-read tables
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

GRANT SELECT ON public.category_sizes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_sizes TO authenticated;
GRANT ALL ON public.category_sizes TO service_role;

GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- Submission tables (anon can INSERT, admins read via RLS)
GRANT INSERT ON public.bookings TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

GRANT INSERT ON public.measurement_bookings TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.measurement_bookings TO authenticated;
GRANT ALL ON public.measurement_bookings TO service_role;

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

GRANT INSERT ON public.custom_build_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.custom_build_requests TO authenticated;
GRANT ALL ON public.custom_build_requests TO service_role;

GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;

-- User-scoped tables (auth only)
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Admin-only at DB level (kept locked, accessed via SECURITY DEFINER or service_role)
GRANT ALL ON public.promo_codes TO service_role;
GRANT ALL ON public.instapay_qr_log TO service_role;

-- Re-grant EXECUTE on the public guest-API SECURITY DEFINER functions
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_order_for_tracking(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb, numeric, text, text, text) TO authenticated;
