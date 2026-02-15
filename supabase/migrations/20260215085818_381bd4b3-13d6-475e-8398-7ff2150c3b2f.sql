
-- ============================================================
-- 1. MENSTRUAL CYCLE PHASE ENUM & TABLES
-- ============================================================

CREATE TYPE public.cycle_phase AS ENUM ('menstrual', 'follicular', 'ovulatory', 'luteal');

-- Per-athlete cycle settings (one row per athlete)
CREATE TABLE public.athlete_cycle_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_length_days INT NOT NULL DEFAULT 28,
  auto_regulation_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id)
);

-- Daily cycle log entries
CREATE TABLE public.daily_cycle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_phase cycle_phase NOT NULL,
  symptom_tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, date)
);

-- RLS for athlete_cycle_settings
ALTER TABLE public.athlete_cycle_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes own their cycle settings"
  ON public.athlete_cycle_settings FOR ALL
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Coaches can view athlete cycle settings"
  ON public.athlete_cycle_settings FOR SELECT
  USING (is_coach_of_athlete(athlete_id));

-- RLS for daily_cycle_logs
ALTER TABLE public.daily_cycle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes own their cycle logs"
  ON public.daily_cycle_logs FOR ALL
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Coaches can view athlete cycle logs"
  ON public.daily_cycle_logs FOR SELECT
  USING (is_coach_of_athlete(athlete_id));

-- Auto-update timestamp trigger
CREATE TRIGGER update_athlete_cycle_settings_updated_at
  BEFORE UPDATE ON public.athlete_cycle_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. VBT COLUMNS ON workout_exercises
-- ============================================================
-- The app stores set-level data in sets_data JSONB, but we add
-- exercise-level VBT summary columns for fast querying/sorting.

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS mean_velocity_ms NUMERIC(5,3),
  ADD COLUMN IF NOT EXISTS peak_velocity_ms NUMERIC(5,3),
  ADD COLUMN IF NOT EXISTS rom_cm NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS calc_power_watts NUMERIC(8,2);

-- ============================================================
-- 3. VOICE / AI SESSION EVENTS
-- ============================================================

CREATE TABLE public.session_voice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL DEFAULT '',
  intent_detected TEXT,
  confidence_score NUMERIC(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.session_voice_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes own their voice events"
  ON public.session_voice_events FOR ALL
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Coaches can view athlete voice events"
  ON public.session_voice_events FOR SELECT
  USING (is_coach_of_athlete(athlete_id));
