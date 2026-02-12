
-- Recreate view with security invoker to use querying user's RLS
CREATE OR REPLACE VIEW public.analytics_athlete_progress
WITH (security_invoker = true) AS
SELECT
  wl.athlete_id,
  wl.completed_at::date AS workout_date,
  COUNT(DISTINCT wl.id) AS sessions_completed,
  COALESCE(SUM(
    (SELECT SUM((s->>'weight_kg')::numeric * (s->>'reps')::numeric)
     FROM workout_exercises we2
     CROSS JOIN LATERAL jsonb_array_elements(we2.sets_data::jsonb) AS s
     WHERE we2.workout_log_id = wl.id
       AND (s->>'weight_kg') IS NOT NULL
       AND (s->>'reps') IS NOT NULL
    )
  ), 0) AS total_volume,
  COALESCE(SUM(
    (SELECT COUNT(*)
     FROM workout_exercises we3
     CROSS JOIN LATERAL jsonb_array_elements(we3.sets_data::jsonb) AS s2
     WHERE we3.workout_log_id = wl.id
    )
  ), 0) AS sets_completed,
  COALESCE(AVG(wl.rpe_global), 0) AS rpe_average,
  dr.score AS readiness_score
FROM workout_logs wl
LEFT JOIN daily_readiness dr
  ON dr.athlete_id = wl.athlete_id
  AND dr.date = wl.completed_at::date
WHERE wl.status = 'completed'
  AND wl.completed_at IS NOT NULL
GROUP BY wl.athlete_id, wl.completed_at::date, dr.score;
