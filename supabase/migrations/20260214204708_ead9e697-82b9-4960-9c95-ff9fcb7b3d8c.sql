
-- Server-side analytics view: ACWR, compliance, last workout, injury status
-- Avoids downloading raw logs to the frontend

CREATE OR REPLACE VIEW public.analytics_athlete_summary
WITH (security_invoker = true)
AS
WITH recent_logs AS (
  SELECT
    wl.athlete_id,
    wl.completed_at,
    wl.scheduled_date,
    wl.status,
    wl.total_load_au,
    wl.rpe_global,
    wl.duration_seconds,
    -- Day index from today (0 = today, 1 = yesterday, etc.)
    (CURRENT_DATE - (wl.completed_at AT TIME ZONE 'UTC')::date) AS days_ago
  FROM workout_logs wl
  WHERE wl.completed_at IS NOT NULL
    AND wl.completed_at >= (NOW() - INTERVAL '42 days')
),
-- Acute load: sum of loads in last 7 days
-- Chronic load: sum of loads in last 28 days
-- Using simple moving average ratios (SMA) which is standard for SQL aggregation
load_windows AS (
  SELECT
    athlete_id,
    COALESCE(SUM(
      CASE WHEN days_ago <= 7 THEN
        CASE
          WHEN total_load_au IS NOT NULL AND total_load_au > 0
            THEN total_load_au * COALESCE(rpe_global, 5)
          WHEN duration_seconds IS NOT NULL AND duration_seconds > 0
            THEN COALESCE(rpe_global, 5) * (duration_seconds / 60.0)
          ELSE 0
        END
      ELSE 0 END
    ), 0) AS acute_load,
    COALESCE(SUM(
      CASE WHEN days_ago <= 28 THEN
        CASE
          WHEN total_load_au IS NOT NULL AND total_load_au > 0
            THEN total_load_au * COALESCE(rpe_global, 5)
          WHEN duration_seconds IS NOT NULL AND duration_seconds > 0
            THEN COALESCE(rpe_global, 5) * (duration_seconds / 60.0)
          ELSE 0
        END
      ELSE 0 END
    ), 0) AS chronic_load
  FROM recent_logs
  GROUP BY athlete_id
),
-- Compliance: completed vs total scheduled in last 30 days
compliance AS (
  SELECT
    wl.athlete_id,
    COUNT(*) FILTER (WHERE wl.status = 'completed') AS completed_count,
    COUNT(*) AS total_count
  FROM workout_logs wl
  WHERE wl.scheduled_date >= (CURRENT_DATE - 30)
  GROUP BY wl.athlete_id
),
-- Last workout date
last_workout AS (
  SELECT
    athlete_id,
    MAX(completed_at) AS last_workout_date
  FROM workout_logs
  WHERE status = 'completed'
  GROUP BY athlete_id
),
-- Active injuries
active_injuries AS (
  SELECT DISTINCT athlete_id, true AS has_injury
  FROM injuries
  WHERE status != 'healed'
)
SELECT
  p.id AS athlete_id,
  p.full_name,
  p.avatar_url,
  p.onboarding_completed,
  p.coach_id,
  -- ACWR: acute (7d avg) / chronic (28d avg), using daily averages
  CASE
    WHEN COALESCE(lw2.chronic_load, 0) = 0 THEN NULL
    ELSE ROUND((COALESCE(lw2.acute_load, 0) / 7.0) / (COALESCE(lw2.chronic_load, 0) / 28.0) * 100) / 100.0
  END AS current_acwr,
  COALESCE(lw2.acute_load, 0) AS acute_load_raw,
  COALESCE(lw2.chronic_load, 0) AS chronic_load_raw,
  -- Compliance rate
  CASE
    WHEN COALESCE(c.total_count, 0) = 0 THEN 0
    ELSE ROUND(COALESCE(c.completed_count, 0)::numeric / c.total_count * 100)
  END AS compliance_rate,
  -- Last workout
  lwk.last_workout_date,
  -- Injury status
  COALESCE(ai.has_injury, false) AS has_active_injury
FROM profiles p
LEFT JOIN load_windows lw2 ON lw2.athlete_id = p.id
LEFT JOIN compliance c ON c.athlete_id = p.id
LEFT JOIN last_workout lwk ON lwk.athlete_id = p.id
LEFT JOIN active_injuries ai ON ai.athlete_id = p.id
WHERE p.role = 'athlete';
