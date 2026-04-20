
-- Replace permissive public-insert policies with constrained versions

DROP POLICY IF EXISTS "Anyone can submit a custom build request" ON public.custom_build_requests;
CREATE POLICY "Anyone can submit a custom build request"
  ON public.custom_build_requests
  FOR INSERT
  WITH CHECK (
    char_length(full_name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(phone) BETWEEN 5 AND 30
    AND room_type IN ('nursery','toddler','playroom','other')
    AND char_length(description) BETWEEN 10 AND 2000
    AND status = 'new'
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can send a message" ON public.contact_messages;
CREATE POLICY "Anyone can send a message"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (
    char_length(full_name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR char_length(phone) BETWEEN 5 AND 30)
    AND char_length(message) BETWEEN 5 AND 3000
  );
