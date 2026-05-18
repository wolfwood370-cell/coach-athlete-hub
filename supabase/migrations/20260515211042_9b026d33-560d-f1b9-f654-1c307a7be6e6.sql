-- =============================================================================
-- AUDIT C8 — Atomic, authorized archive_athlete() RPC
-- =============================================================================
-- The previous archive flow read profiles.settings on the client, merged
-- {archived: true, archived_at: ...} into the JSONB, and wrote it back. Two
-- problems:
--   1. Race condition: if two coach tabs (or two coaches, in a future
--      shared-roster world) mutate settings concurrently, the last writer
--      silently clobbers the first.
--   2. Authorization is enforced only via RLS on the UPDATE — fine for now,
--      but couples the rule to every column. Centralising it in a function
--      makes the contract explicit.
--
-- This RPC fixes both:
--   - Uses jsonb_set server-side so the archive flags are merged atomically
--     into the existing settings document. No read-modify-write window.
--   - Is SECURITY DEFINER + explicit is_coach_of_athlete() check, so the
--     authorization rule lives in one auditable place.
--   - SET search_path = public to defend against search_path injection
--     against SECURITY DEFINER functions.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.archive_athlete(p_athlete_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller   uuid := auth.uid();
  v_allowed  boolean;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  -- Reuse the canonical helper. Allows self-archive too in case the caller
  -- is the athlete themselves (e.g. account deactivation flow); coach
  -- ownership is the other accepted path.
  v_allowed := (v_caller = p_athlete_id)
               OR public.is_coach_of_athlete(p_athlete_id);

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to archive this athlete'
      USING ERRCODE = '42501';
  END IF;

  -- Atomic JSONB merge — no read-modify-write race.
  UPDATE public.profiles
     SET settings = jsonb_set(
                      jsonb_set(
                        COALESCE(settings, '{}'::jsonb),
                        '{archived}',
                        'true'::jsonb,
                        true
                      ),
                      '{archived_at}',
                      to_jsonb(now()::text),
                      true
                    ),
         updated_at = now()
   WHERE id = p_athlete_id;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_athlete(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.archive_athlete(uuid) TO authenticated;

COMMENT ON FUNCTION public.archive_athlete(uuid) IS
  'Atomically marks a profile as archived (settings.archived=true, '
  'settings.archived_at=now). Coach-of-athlete or self only. Replaces the '
  'previous client-side read-modify-write JSONB patch (C8 audit finding).';
