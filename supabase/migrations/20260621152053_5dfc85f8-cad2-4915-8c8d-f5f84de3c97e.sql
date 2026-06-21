
CREATE OR REPLACE FUNCTION public.enforce_custom_build_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_custom_build_user_id_trg ON public.custom_build_requests;
CREATE TRIGGER enforce_custom_build_user_id_trg
BEFORE INSERT ON public.custom_build_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_custom_build_user_id();

DROP POLICY IF EXISTS "Anyone can submit a custom build request" ON public.custom_build_requests;
CREATE POLICY "Anyone can submit a custom build request"
ON public.custom_build_requests
FOR INSERT
WITH CHECK (
  char_length(full_name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(phone) BETWEEN 5 AND 30
  AND room_type = ANY (ARRAY['nursery','toddler','playroom','other'])
  AND char_length(description) BETWEEN 10 AND 2000
  AND status = 'new'
  AND user_id IS NOT DISTINCT FROM auth.uid()
);
