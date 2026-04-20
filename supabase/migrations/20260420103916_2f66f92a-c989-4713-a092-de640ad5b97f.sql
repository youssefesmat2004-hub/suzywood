
-- =====================================================
-- SUZY WOOD — Phase 1 Schema
-- =====================================================

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- PROFILES
-- =====================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- USER ROLES (for future admin)
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- CATEGORIES
-- =====================================================
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are public" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.categories (slug, name, description, sort_order) VALUES
  ('nursery', 'Nursery', 'Cribs, co-sleepers, changing tables and bassinets.', 1),
  ('kids-beds', 'Kids Beds', 'Toddler beds, junior beds and bunk beds.', 2),
  ('storage-study', 'Storage & Study', 'Wardrobes, dressers, bookshelves and desks.', 3),
  ('play-safety', 'Play & Safety', 'Gates, bed rails, anchors, teepees and play tables.', 4);

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  tagline text,
  description text,
  starting_price numeric(10,2) NOT NULL CHECK (starting_price >= 0),
  image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  finishes jsonb NOT NULL DEFAULT '[]'::jsonb,
  materials text,
  safety_info text,
  care_info text,
  lead_time_weeks int NOT NULL DEFAULT 4,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are public" ON public.products
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed products
INSERT INTO public.products (slug, category_id, name, tagline, description, starting_price, image_url, gallery, sizes, finishes, materials, safety_info, care_info, is_featured)
SELECT
  s.slug, c.id, s.name, s.tagline, s.description, s.price, s.image, s.gallery::jsonb, s.sizes::jsonb, s.finishes::jsonb, s.materials, s.safety, s.care, s.featured
FROM public.categories c
JOIN (VALUES
  ('signature-crib', 'nursery', 'The Signature Crib', 'Heirloom oak crib, made to last generations.',
   'Hand-joined from solid European oak with rounded teething rails, three mattress heights, and a non-toxic plant-based finish. Designed to grow with your child and pass between siblings.',
   18500.00, '/src/assets/product-crib.jpg',
   '["/src/assets/product-crib.jpg","/src/assets/product-changing-detail.jpg"]',
   '[{"label":"Standard 60 × 120 cm","value":"standard"},{"label":"Grand 70 × 140 cm","value":"grand"}]',
   '[{"label":"Natural Oak","value":"oak"},{"label":"Matte White","value":"white"},{"label":"Sage Green","value":"sage"}]',
   'Solid European oak, mortise-and-tenon joinery, plant-based oil finish.',
   'JPMA-equivalent slat spacing (≤6 cm). No drop sides. Lead-free, BPA-free, food-contact safe finish. Rounded edges throughout.',
   'Wipe with a damp cloth. Re-oil every 12 months with our complimentary oil kit.',
   true),
  ('toddler-bed', 'kids-beds', 'The Little Bed', 'Their first big-kid bed.',
   'Low to the floor with gently curved guard rails. Made in solid oak with a finish safe enough for the youngest hands and mouths.',
   12400.00, '/src/assets/product-toddler-bed.jpg',
   '["/src/assets/product-toddler-bed.jpg","/src/assets/product-changing-detail.jpg"]',
   '[{"label":"Toddler 70 × 140 cm","value":"toddler"},{"label":"Junior 90 × 180 cm","value":"junior"}]',
   '[{"label":"Natural Oak","value":"oak"},{"label":"Matte White","value":"white"},{"label":"Sage Green","value":"sage"}]',
   'Solid European oak with FSC-certified slat base.',
   'Curved guard rails, low frame height, rounded corners. Non-toxic finish.',
   'Wipe clean. Tighten bolts every 6 months.',
   true),
  ('custom-changing-table', 'nursery', 'Customizable Changing Table', 'A calm corner for every routine.',
   'Open shelving and a soft-close drawer in a silhouette that converts to a console once the changing days are over. Crafted to your chosen size and finish.',
   9800.00, '/src/assets/product-changing-table.jpg',
   '["/src/assets/product-changing-table.jpg","/src/assets/product-changing-detail.jpg"]',
   '[{"label":"Standard 80 cm","value":"standard"},{"label":"Double 120 cm","value":"double"}]',
   '[{"label":"Natural Oak","value":"oak"},{"label":"Matte White","value":"white"},{"label":"Sage Green","value":"sage"}]',
   'Solid oak frame, soft-close drawer hardware.',
   'Anti-tip wall anchor included. Rounded edges. Non-toxic finish.',
   'Wipe with a damp cloth. Avoid harsh cleaners.',
   true),
  ('safety-gate', 'play-safety', 'Heirloom Safety Gate', 'Quiet protection, beautifully built.',
   'A pressure-mounted oak gate with a one-handed magnetic latch — designed to disappear into your home rather than interrupt it.',
   4200.00, '/src/assets/product-gate.jpg',
   '["/src/assets/product-gate.jpg","/src/assets/product-changing-detail.jpg"]',
   '[{"label":"Doorway 75–85 cm","value":"door"},{"label":"Wide 85–105 cm","value":"wide"}]',
   '[{"label":"Natural Oak","value":"oak"},{"label":"Matte White","value":"white"},{"label":"Sage Green","value":"sage"}]',
   'Solid oak with stainless-steel hardware.',
   'One-handed magnetic latch, pressure-mount with rubber pads to protect walls.',
   'Wipe clean. Re-tighten pressure mounts monthly.',
   false)
) AS s(slug, cat_slug, name, tagline, description, price, image, gallery, sizes, finishes, materials, safety, care, featured)
ON c.slug = s.cat_slug;

-- =====================================================
-- REVIEWS
-- =====================================================
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published reviews are public" ON public.reviews
  FOR SELECT USING (is_published = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- WISHLIST
-- =====================================================
CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wishlist" ON public.wishlist_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users add to own wishlist" ON public.wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove from own wishlist" ON public.wishlist_items
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ORDERS
-- =====================================================
CREATE TYPE public.order_status AS ENUM (
  'pending_payment', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled'
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT 'SW-' || to_char(now(), 'YYMMDD') || '-' || lpad((floor(random() * 10000))::text, 4, '0'),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'pending_payment',
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_governorate text NOT NULL,
  shipping_notes text,
  subtotal numeric(10,2) NOT NULL,
  shipping_fee numeric(10,2) NOT NULL DEFAULT 1000,
  total numeric(10,2) NOT NULL,
  payment_method text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON public.orders(user_id);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can create order" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  size text,
  finish text,
  engraving text,
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  line_total numeric(10,2) NOT NULL
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "Users create own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR o.user_id IS NULL)
    )
  );

-- =====================================================
-- CUSTOM BUILD REQUESTS
-- =====================================================
CREATE TABLE public.custom_build_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  room_type text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_build_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a custom build request" ON public.custom_build_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own custom requests" ON public.custom_build_requests
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update custom requests" ON public.custom_build_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- CONTACT MESSAGES
-- =====================================================
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send a message" ON public.contact_messages
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read messages" ON public.contact_messages
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
