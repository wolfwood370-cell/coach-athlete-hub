-- =============================================================================
-- AUDIT C4 — Remove unsafe profiles SELECT policy for chat participants
-- =============================================================================
-- The legacy policy "Read profiles of shared chat rooms" (introduced by
-- 20260503221529) granted every authenticated user SELECT access to the
-- FULL row of every profile they shared a chat room with — including
-- clinically sensitive fields like onboarding_data, red_flags,
-- medical_clearance_required, neurotype. GDPR Art. 9 territory.
--
-- We replace it with a narrow SECURITY DEFINER RPC that returns ONLY the
-- three fields the chat UI actually needs (id, full_name, avatar_url), and
-- gates the result so a caller can only resolve profiles of users they
-- genuinely share a chat room with. The frontend (useChatRooms.ts) is
-- updated in the same change set to call the RPC instead of querying
-- public.profiles directly.
-- =============================================================================

-- 1. Drop the over-broad policy.
DROP POLICY IF EXISTS "Read profiles of shared chat rooms" ON public.profiles;

-- 2. Replace with a SECURITY DEFINER function that returns only safe fields.
--    The function:
--      - Runs with definer privileges so it bypasses the profiles RLS we
--        just tightened.
--      - Hard-codes the column projection: sensitive fields CANNOT leak
--        because they are not in the SELECT list.
--      - Enforces the membership check (caller must share a chat room with
--        each returned profile) inside the SQL — so even if a malicious
--        caller passes arbitrary UUIDs, only legitimate chat partners are
--        returned.
--      - STABLE: result depends only on the arguments and the current
--        snapshot, safe for the query planner.
CREATE OR REPLACE FUNCTION public.get_chat_partner_profiles(p_user_ids uuid[])
RETURNS TABLE (
  id         uuid,
  full_name  text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(p_user_ids)
    AND (
      -- Self always allowed (the chat UI also renders the caller's own avatar).
      p.id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.chat_participants me
        JOIN public.chat_participants other
          ON other.room_id = me.room_id
        WHERE me.user_id = auth.uid()
          AND other.user_id = p.id
      )
    );
$$;

-- 3. Expose to authenticated callers only. (No anon access — chat is a
--    logged-in feature.)
REVOKE ALL ON FUNCTION public.get_chat_partner_profiles(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_chat_partner_profiles(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.get_chat_partner_profiles(uuid[]) IS
  'Returns id/full_name/avatar_url for chat partners only. Replaces the unsafe ' ||
  '"Read profiles of shared chat rooms" RLS policy (C4 audit finding). Sensitive ' ||
  'columns (onboarding_data, red_flags, medical_clearance_required, neurotype) ' ||
  'cannot leak through this function — they are not in the projection.';
