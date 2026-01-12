-- Fix handle_new_user function with proper input validation and sanitization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  safe_name TEXT;
BEGIN
  -- Sanitize and validate the full_name from metadata
  safe_name := COALESCE(TRIM(NEW.raw_user_meta_data->>'full_name'), '');
  
  -- Limit length to 100 characters to prevent excessive input
  safe_name := LEFT(safe_name, 100);
  
  -- Remove any null bytes or control characters
  safe_name := regexp_replace(safe_name, E'[\\x00-\\x1F\\x7F]', '', 'g');
  
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NULLIF(safe_name, ''));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;