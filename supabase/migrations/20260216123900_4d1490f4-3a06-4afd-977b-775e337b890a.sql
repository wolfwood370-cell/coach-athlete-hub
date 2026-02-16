-- Performance indexes on frequently queried columns

-- Workout logs: queried by athlete + date range constantly
CREATE INDEX IF NOT EXISTS idx_workout_logs_athlete_date ON public.workout_logs (athlete_id, scheduled_date);

-- Messages: queried by room_id and created_at for chat history
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages (room_id, created_at DESC);

-- Workout exercises: queried by workout_log_id to build workout view
CREATE INDEX IF NOT EXISTS idx_workout_exercises_log_id ON public.workout_exercises (workout_log_id);

-- Athlete subscriptions: checked on every login/profile load
CREATE INDEX IF NOT EXISTS idx_athlete_subs_athlete_status ON public.athlete_subscriptions (athlete_id, status);

-- Weekly checkins: queried by coach + status for inbox
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_coach_status ON public.weekly_checkins (coach_id, status);

-- Daily readiness: queried by athlete + date
CREATE INDEX IF NOT EXISTS idx_daily_readiness_athlete_date ON public.daily_readiness (athlete_id, date);

-- Meal logs: queried by user + date
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON public.meal_logs (user_id, date);