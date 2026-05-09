CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  safe_name      TEXT;
  user_email     TEXT;
  meta_coach_id  UUID;
  invite_record  RECORD;
  chosen_role    public.user_role;
  coach_exists   BOOLEAN;
BEGIN
  safe_name := COALESCE(TRIM(NEW.raw_user_meta_data->>'full_name'), '');
  safe_name := LEFT(safe_name, 100);
  safe_name := regexp_replace(safe_name, E'[\\x00-\\x1F\\x7F]', '', 'g');

  user_email := NEW.email;

  BEGIN
    meta_coach_id := NULLIF(NEW.raw_user_meta_data->>'coach_id', '')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    meta_coach_id := NULL;
  END;

  IF meta_coach_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = meta_coach_id
        AND role = 'coach'::public.user_role
    ) INTO coach_exists;

    IF coach_exists THEN
      INSERT INTO public.profiles (
        id, full_name, role, coach_id, onboarding_completed
      )
      VALUES (
        NEW.id,
        NULLIF(safe_name, ''),
        'athlete'::public.user_role,
        meta_coach_id,
        false
      );
      RETURN NEW;
    END IF;
  END IF;

  SELECT *
  INTO invite_record
  FROM public.invite_tokens
  WHERE email = user_email
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    INSERT INTO public.profiles (
      id, full_name, role, coach_id, onboarding_completed
    )
    VALUES (
      NEW.id,
      COALESCE(NULLIF(safe_name, ''), invite_record.full_name),
      'athlete'::public.user_role,
      invite_record.coach_id,
      false
    );

    UPDATE public.invite_tokens
       SET used = true
     WHERE id = invite_record.id;

    RETURN NEW;
  END IF;

  BEGIN
    chosen_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    chosen_role := 'athlete'::public.user_role;
  END;

  IF chosen_role IS NULL THEN
    chosen_role := 'athlete'::public.user_role;
  END IF;

  INSERT INTO public.profiles (
    id, full_name, role, onboarding_completed
  )
  VALUES (
    NEW.id,
    NULLIF(safe_name, ''),
    chosen_role,
    (chosen_role = 'coach'::public.user_role)
  );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();