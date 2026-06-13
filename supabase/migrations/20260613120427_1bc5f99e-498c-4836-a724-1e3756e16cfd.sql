ALTER TABLE public.products ADD CONSTRAINT products_lead_time_weeks_range CHECK (lead_time_weeks BETWEEN 1 AND 4);
ALTER TABLE public.products ALTER COLUMN lead_time_weeks SET DEFAULT 4;