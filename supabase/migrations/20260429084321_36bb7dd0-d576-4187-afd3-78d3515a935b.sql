CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  safe_name TEXT;
  invite_record RECORD;
  user_email TEXT;
  chosen_role public.user_role;
BEGIN
  -- Sanitize and validate the full_name from metadata
  safe_name := COALESCE(TRIM(NEW.raw_user_meta_data->>'full_name'), '');
  safe_name := LEFT(safe_name, 100);
  safe_name := regexp_replace(safe_name, E'[\\x00-\\x1F\\x7F]', '', 'g');

  user_email := NEW.email;

  -- Determine role from signup metadata; default to 'athlete' if missing/invalid
  BEGIN
    chosen_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    chosen_role := 'athlete'::public.user_role;
  END;
  IF chosen_role IS NULL THEN
    chosen_role := 'athlete'::public.user_role;
  END IF;

  -- Check for pending invite for this email (invites always create athletes)
  SELECT * INTO invite_record
  FROM public.invite_tokens
  WHERE email = user_email
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, role, coach_id, onboarding_completed)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(safe_name, ''), invite_record.full_name),
      'athlete',
      invite_record.coach_id,
      false
    );
    UPDATE public.invite_tokens SET used = true WHERE id = invite_record.id;
  ELSE
    -- Standard profile creation honoring chosen role.
    -- Coaches skip onboarding automatically.
    INSERT INTO public.profiles (id, full_name, role, onboarding_completed)
    VALUES (
      NEW.id,
      NULLIF(safe_name, ''),
      chosen_role,
      (chosen_role = 'coach'::public.user_role)
    );
  END IF;

  RETURN NEW;
END;
$function$;