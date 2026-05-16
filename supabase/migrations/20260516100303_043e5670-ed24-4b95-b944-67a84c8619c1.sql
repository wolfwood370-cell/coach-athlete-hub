
-- Safe profile lookup limited to chat partners
CREATE OR REPLACE FUNCTION public.get_chat_partner_profiles(p_user_ids uuid[])
RETURNS TABLE (id uuid, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(p_user_ids)
    AND (
      p.id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.chat_participants cp_self
        JOIN public.chat_participants cp_other
          ON cp_other.room_id = cp_self.room_id
        WHERE cp_self.user_id = auth.uid()
          AND cp_other.user_id = p.id
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_chat_partner_profiles(uuid[]) TO authenticated;

-- Archive an athlete (coach-only, atomic)
CREATE OR REPLACE FUNCTION public.archive_athlete(p_athlete_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_coach_of_athlete(auth.uid(), p_athlete_id) THEN
    RAISE EXCEPTION 'Not authorized to archive this athlete';
  END IF;

  UPDATE public.profiles
  SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{archived}',
        'true'::jsonb,
        true
      ),
      updated_at = now()
  WHERE id = p_athlete_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_athlete(uuid) TO authenticated;
