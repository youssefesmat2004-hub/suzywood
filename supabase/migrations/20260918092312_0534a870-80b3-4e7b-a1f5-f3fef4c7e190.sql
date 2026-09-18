CREATE TABLE public.order_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'delivery',
  reviewer_name text NOT NULL,
  experience_rating integer,
  product_rating integer,
  service_rating integer,
  comment text,
  is_published boolean NOT NULL DEFAULT false,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_reviews_kind_check CHECK (kind IN ('experience','delivery')),
  CONSTRAINT order_reviews_experience_range CHECK (experience_rating IS NULL OR (experience_rating BETWEEN 1 AND 5)),
  CONSTRAINT order_reviews_product_range CHECK (product_rating IS NULL OR (product_rating BETWEEN 1 AND 5)),
  CONSTRAINT order_reviews_service_range CHECK (service_rating IS NULL OR (service_rating BETWEEN 1 AND 5))
);

CREATE UNIQUE INDEX order_reviews_unique_per_order_kind ON public.order_reviews (order_id, kind);
CREATE INDEX order_reviews_product_published_idx ON public.order_reviews (product_id, is_published);

GRANT SELECT ON public.order_reviews TO anon;
GRANT SELECT, UPDATE, DELETE ON public.order_reviews TO authenticated;
GRANT ALL ON public.order_reviews TO service_role;

ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published reviews are public"
  ON public.order_reviews FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reviews"
  ON public.order_reviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reviews"
  ON public.order_reviews FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_order_reviews_updated_at
  BEFORE UPDATE ON public.order_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_token text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_email_sent_at timestamp with time zone;
CREATE UNIQUE INDEX IF NOT EXISTS orders_review_token_key ON public.orders (review_token) WHERE review_token IS NOT NULL;