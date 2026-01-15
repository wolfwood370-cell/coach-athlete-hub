-- =============================================
-- PROGRAM BUILDER SCHEMA
-- =============================================

-- 1. PROGRAM PLANS - Master container
CREATE TABLE public.program_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. PROGRAM WEEKS - Weeks within a program
CREATE TABLE public.program_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_plan_id UUID NOT NULL REFERENCES public.program_plans(id) ON DELETE CASCADE,
  week_order SMALLINT NOT NULL DEFAULT 1,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. PROGRAM DAYS - Days within a week (1-7)
CREATE TABLE public.program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_week_id UUID NOT NULL REFERENCES public.program_weeks(id) ON DELETE CASCADE,
  day_number SMALLINT NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. PROGRAM WORKOUTS - Workouts within a day
CREATE TABLE public.program_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_day_id UUID NOT NULL REFERENCES public.program_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. PROGRAM EXERCISES - Exercises with prescriptions
CREATE TABLE public.program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_workout_id UUID NOT NULL REFERENCES public.program_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  sets SMALLINT,
  reps TEXT,
  load_text TEXT,
  rpe TEXT,
  rest TEXT,
  tempo TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_program_plans_coach_id ON public.program_plans(coach_id);
CREATE INDEX idx_program_weeks_plan_id ON public.program_weeks(program_plan_id);
CREATE INDEX idx_program_days_week_id ON public.program_days(program_week_id);
CREATE INDEX idx_program_workouts_day_id ON public.program_workouts(program_day_id);
CREATE INDEX idx_program_exercises_workout_id ON public.program_exercises(program_workout_id);
CREATE INDEX idx_program_exercises_exercise_id ON public.program_exercises(exercise_id);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.program_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_exercises ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - PROGRAM PLANS
-- =============================================

CREATE POLICY "Coaches can view their own program plans"
ON public.program_plans FOR SELECT
USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own program plans"
ON public.program_plans FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own program plans"
ON public.program_plans FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own program plans"
ON public.program_plans FOR DELETE
USING (coach_id = auth.uid());

-- =============================================
-- RLS POLICIES - PROGRAM WEEKS (via plan ownership)
-- =============================================

CREATE POLICY "Coaches can view weeks in their plans"
ON public.program_weeks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.program_plans
    WHERE program_plans.id = program_weeks.program_plan_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can insert weeks in their plans"
ON public.program_weeks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.program_plans
    WHERE program_plans.id = program_weeks.program_plan_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update weeks in their plans"
ON public.program_weeks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.program_plans
    WHERE program_plans.id = program_weeks.program_plan_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete weeks in their plans"
ON public.program_weeks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.program_plans
    WHERE program_plans.id = program_weeks.program_plan_id
    AND program_plans.coach_id = auth.uid()
  )
);

-- =============================================
-- RLS POLICIES - PROGRAM DAYS (via week -> plan ownership)
-- =============================================

CREATE POLICY "Coaches can view days in their plans"
ON public.program_days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.program_weeks
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_weeks.id = program_days.program_week_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can insert days in their plans"
ON public.program_days FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.program_weeks
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_weeks.id = program_days.program_week_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update days in their plans"
ON public.program_days FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.program_weeks
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_weeks.id = program_days.program_week_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete days in their plans"
ON public.program_days FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.program_weeks
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_weeks.id = program_days.program_week_id
    AND program_plans.coach_id = auth.uid()
  )
);

-- =============================================
-- RLS POLICIES - PROGRAM WORKOUTS (via day -> week -> plan)
-- =============================================

CREATE POLICY "Coaches can view workouts in their plans"
ON public.program_workouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.program_days
    JOIN public.program_weeks ON program_weeks.id = program_days.program_week_id
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_days.id = program_workouts.program_day_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can insert workouts in their plans"
ON public.program_workouts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.program_days
    JOIN public.program_weeks ON program_weeks.id = program_days.program_week_id
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_days.id = program_workouts.program_day_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update workouts in their plans"
ON public.program_workouts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.program_days
    JOIN public.program_weeks ON program_weeks.id = program_days.program_week_id
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_days.id = program_workouts.program_day_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete workouts in their plans"
ON public.program_workouts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.program_days
    JOIN public.program_weeks ON program_weeks.id = program_days.program_week_id
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_days.id = program_workouts.program_day_id
    AND program_plans.coach_id = auth.uid()
  )
);

-- =============================================
-- RLS POLICIES - PROGRAM EXERCISES (via workout -> day -> week -> plan)
-- =============================================

CREATE POLICY "Coaches can view exercises in their plans"
ON public.program_exercises FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.program_workouts
    JOIN public.program_days ON program_days.id = program_workouts.program_day_id
    JOIN public.program_weeks ON program_weeks.id = program_days.program_week_id
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_workouts.id = program_exercises.program_workout_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can insert exercises in their plans"
ON public.program_exercises FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.program_workouts
    JOIN public.program_days ON program_days.id = program_workouts.program_day_id
    JOIN public.program_weeks ON program_weeks.id = program_days.program_week_id
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_workouts.id = program_exercises.program_workout_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update exercises in their plans"
ON public.program_exercises FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.program_workouts
    JOIN public.program_days ON program_days.id = program_workouts.program_day_id
    JOIN public.program_weeks ON program_weeks.id = program_days.program_week_id
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_workouts.id = program_exercises.program_workout_id
    AND program_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete exercises in their plans"
ON public.program_exercises FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.program_workouts
    JOIN public.program_days ON program_days.id = program_workouts.program_day_id
    JOIN public.program_weeks ON program_weeks.id = program_days.program_week_id
    JOIN public.program_plans ON program_plans.id = program_weeks.program_plan_id
    WHERE program_workouts.id = program_exercises.program_workout_id
    AND program_plans.coach_id = auth.uid()
  )
);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE TRIGGER update_program_plans_updated_at
BEFORE UPDATE ON public.program_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();