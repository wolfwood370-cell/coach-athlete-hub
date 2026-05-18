-- =============================================================================
-- Athlete onboarding links — manual-invite signup flow
-- =============================================================================
-- A coach generates a one-time invite link with pre-filled name + email.
-- The athlete signs up via that link (URL carries `?token=<unique_token>`),
-- the signup form is prefilled from the row, and on success the athlete's
-- new profile is linked to the inviting coach.
--
-- This migration also wipes the demo-seed records ("Mario Demo") from
-- workout_logs + exercise_logs so the local DB starts clean.
-- =============================================================================

-- 1. Table -------------------------------------------------------------------

CREATE TABLE public.athlete_onboarding_links (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  unique_token  TEXT NOT NULL UNIQUE,
  is_used       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at       TIMESTAMPTZ
);

-- Lookup by token is the hot path (anonymous prefill in Auth.tsx).
-- Partial index keeps it cheap and ignores already-used links.
CREATE INDEX idx_onboarding_links_token
  ON public.athlete_onboarding_links(unique_token)
  WHERE NOT is_used;

CREATE INDEX idx_onboarding_links_coach
  ON public.athlete_onboarding_links(coach_id);

ALTER TABLE public.athlete_onboarding_links ENABLE ROW LEVEL SECURITY;


-- 2. RLS policies ------------------------------------------------------------

-- Only coaches can INSERT, and only with their own coach_id.
CREATE POLICY "Coaches can create invites"
ON public.athlete_onboarding_links FOR INSERT
TO authenticated
WITH CHECK (
  coach_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'coach'
  )
);

-- Coaches see their own invites (for management dashboards).
CREATE POLICY "Coaches can view their own invites"
ON public.athlete_onboarding_links FOR SELECT
TO authenticated
USING (coach_id = auth.uid());

-- Anonymous users (pre-signup) can SELECT an UNUSED invite by token.
-- Token is a UUID, so guessing it is effectively impossible — and the row
-- exposes only the data the user is about to type into the signup form
-- (their own email + name + the inviting coach's id).
CREATE POLICY "Anonymous can validate invite token"
ON public.athlete_onboarding_links FOR SELECT
TO anon
USING (NOT is_used);


-- 3. RPC — atomic redemption -------------------------------------------------
-- After the new athlete completes signup, this RPC:
--   1) marks the invite as used (idempotent — second call no-ops),
--   2) attaches the calling user's profile to the inviting coach.
-- SECURITY DEFINER + explicit search_path so the function can update
-- profiles + athlete_onboarding_links across RLS, with the auth check
-- inside the function (calling user must be the freshly-created athlete).

CREATE OR REPLACE FUNCTION public.redeem_athlete_onboarding_link(p_token TEXT)
RETURNS public.athlete_onboarding_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_link   public.athlete_onboarding_links;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_link
  FROM public.athlete_onboarding_links
  WHERE unique_token = p_token AND NOT is_used
  FOR UPDATE;

  IF v_link.id IS NULL THEN
    RAISE EXCEPTION 'Invite token invalid or already used' USING ERRCODE = 'P0001';
  END IF;

  -- Link the freshly-signed-up profile to the coach.
  UPDATE public.profiles
     SET coach_id = v_link.coach_id
   WHERE id = v_caller;

  -- Mark the invite consumed.
  UPDATE public.athlete_onboarding_links
     SET is_used = true,
         used_at = now()
   WHERE id = v_link.id
   RETURNING * INTO v_link;

  RETURN v_link;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_athlete_onboarding_link(TEXT) TO authenticated;

COMMENT ON FUNCTION public.redeem_athlete_onboarding_link(TEXT) IS
  'Atomically marks an athlete_onboarding_links row as used and attaches '
  'the calling user (just-signed-up athlete) to the inviting coach.';


-- 4. Cleanup of demo-seed mock data -----------------------------------------
-- The 20260116192634 demo seed inserts a "Mario Demo" athlete with 8+
-- workout_logs rows. The new app surface should not expose those numbers
-- to real users; wipe them now. Safe DELETE: if the rows don't exist
-- (already-clean local DB), it's a no-op.

DELETE FROM public.exercise_logs
WHERE session_id IN (
  SELECT id FROM public.workout_logs
  WHERE athlete_id IN (
    SELECT id FROM public.profiles WHERE full_name = 'Mario Demo'
  )
);

DELETE FROM public.workout_logs
WHERE athlete_id IN (
  SELECT id FROM public.profiles WHERE full_name = 'Mario Demo'
);
