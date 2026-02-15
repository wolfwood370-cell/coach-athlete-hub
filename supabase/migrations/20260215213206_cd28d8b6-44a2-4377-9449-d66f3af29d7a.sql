
-- Badges definition table
CREATE TABLE public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  threshold_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Everyone can read badge definitions
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

-- User badges (awarded achievements)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view athlete badges"
  ON public.user_badges FOR SELECT
  USING (is_coach_of_athlete(user_id));

CREATE POLICY "System can insert badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Leaderboard cache table (updated periodically)
CREATE TABLE public.leaderboard_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coach_id UUID,
  week_volume BIGINT NOT NULL DEFAULT 0,
  workout_count INTEGER NOT NULL DEFAULT 0,
  streak_weeks INTEGER NOT NULL DEFAULT 0,
  max_load_kg NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Athletes can see leaderboard for their coach's roster
CREATE POLICY "Athletes can view same-coach leaderboard"
  ON public.leaderboard_cache FOR SELECT
  USING (
    coach_id IN (
      SELECT p.coach_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Coaches can view their leaderboard"
  ON public.leaderboard_cache FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Users can upsert own leaderboard"
  ON public.leaderboard_cache FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own leaderboard"
  ON public.leaderboard_cache FOR UPDATE
  USING (user_id = auth.uid());

-- Athlete privacy preference for leaderboard
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leaderboard_anonymous BOOLEAN NOT NULL DEFAULT false;

-- Seed badge definitions
INSERT INTO public.badges (id, name, description, icon_key, category, threshold_value) VALUES
  ('first_step', 'Primo Passo', 'Completa il tuo primo allenamento', 'footprints', 'milestone', 1),
  ('on_fire', 'On Fire', 'Mantieni una streak di 4 settimane consecutive', 'flame', 'consistency', 4),
  ('heavy_lifter', 'Heavy Lifter', 'Supera 10.000 kg di volume in una singola sessione', 'dumbbell', 'strength', 10000),
  ('iron_will', 'Volontà di Ferro', 'Completa 50 allenamenti', 'shield', 'milestone', 50),
  ('centurion', 'Centurion', 'Completa 100 allenamenti', 'crown', 'milestone', 100),
  ('early_bird', 'Early Bird', 'Completa 10 allenamenti prima delle 8:00', 'sunrise', 'lifestyle', 10),
  ('consistency_king', 'Re della Costanza', 'Streak di 8 settimane consecutive', 'trophy', 'consistency', 8),
  ('volume_beast', 'Volume Beast', 'Accumula 100.000 kg di volume totale', 'zap', 'strength', 100000);
