-- =============================================================================
-- Drop the obsolete athlete_onboarding_links machinery
-- =============================================================================
-- Migration `20260518110000_athlete_onboarding_links.sql` created
--   - table   public.athlete_onboarding_links
--   - RPC     public.redeem_athlete_onboarding_link(text)
--   - 3 RLS policies on that table
--
-- Upstream then introduced a different invite flow via the
-- `invite_tokens` table + a `handle_new_user` DB trigger that
-- redeems on signup by email match. The athlete_onboarding_links
-- objects are no longer referenced by any application code (types.ts,
-- Auth.tsx, and InviteAthleteDialog.tsx have all switched to
-- invite_tokens).
--
-- This migration removes the orphan objects from the schema so the
-- DB state matches the application surface. Idempotent — uses
-- IF EXISTS so a fresh local DB (where 20260518110000 was already
-- effectively superseded) doesn't error.
-- =============================================================================

-- Drop the RPC first so policies that may reference it don't block.
DROP FUNCTION IF EXISTS public.redeem_athlete_onboarding_link(TEXT);

-- The table's RLS policies are dropped automatically with the table.
DROP TABLE IF EXISTS public.athlete_onboarding_links CASCADE;
