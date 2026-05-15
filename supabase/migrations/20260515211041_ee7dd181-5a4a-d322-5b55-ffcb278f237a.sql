-- =============================================================================
-- AUDIT C7 — Remove workout_logs from the supabase_realtime publication
-- =============================================================================
-- The original migration (20260212034952) added public.workout_logs to the
-- supabase_realtime publication so the Coach Athletes page could light up
-- a "live session" indicator the instant an athlete started a workout.
--
-- Problem: realtime broadcasts the FULL row payload over the WebSocket
-- regardless of RLS. Every coach subscribed to the channel therefore
-- received every workout_log insert/update from every athlete in the
-- system (athlete_id, status, RPE, timestamps) and merely discarded them
-- client-side because they did not match the local roster. That is both a
-- cross-tenant metadata leak and a scalability disaster (1000 coaches × N
-- writes = N×1000 fan-out per write).
--
-- The audit's preferred remediation is "abolish realtime for workout_logs
-- and lean on the existing 30-second refetchInterval, which is more than
-- sufficient for the live-session use case." We do that here, at the DB
-- layer, so it cannot be re-enabled by accident from the client.
--
-- If a future feature genuinely needs workout_logs realtime, it should
-- re-add the table to the publication explicitly AND ship the subscription
-- with a server-side filter (e.g. `athlete_id=eq.<uuid>`) per channel.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'workout_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.workout_logs';
  END IF;
END $$;
