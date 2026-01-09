-- Create role enum
CREATE TYPE public.user_role AS ENUM ('coach', 'athlete');

-- Create workout status enum
CREATE TYPE public.workout_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'athlete',
  full_name TEXT,
  coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  avatar_url TEXT,
  one_rm_data JSONB DEFAULT '{}'::jsonb, -- Store 1RM for exercises: {"squat": 150, "bench": 100}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
-- Everyone can view profiles (needed for coach to see athletes, athletes to see coach)
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create daily_readiness table
CREATE TABLE public.daily_readiness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  sleep_hours NUMERIC(3,1),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  has_pain BOOLEAN DEFAULT false,
  soreness_map JSONB DEFAULT '{}'::jsonb, -- {"shoulders": 3, "lower_back": 2}
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(athlete_id, date)
);

-- Enable RLS on daily_readiness
ALTER TABLE public.daily_readiness ENABLE ROW LEVEL SECURITY;

-- Athletes can view and manage their own readiness
CREATE POLICY "Athletes can view their own readiness"
ON public.daily_readiness FOR SELECT
TO authenticated
USING (
  athlete_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'coach'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS athlete 
      WHERE athlete.id = daily_readiness.athlete_id 
      AND athlete.coach_id = auth.uid()
    )
  )
);

CREATE POLICY "Athletes can insert their own readiness"
ON public.daily_readiness FOR INSERT
TO authenticated
WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can update their own readiness"
ON public.daily_readiness FOR UPDATE
TO authenticated
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

-- Create workouts table
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  status workout_status NOT NULL DEFAULT 'pending',
  estimated_duration INTEGER, -- minutes
  structure JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of exercises with sets
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Coaches can manage workouts they created or for their athletes
CREATE POLICY "Coaches can view workouts for their athletes"
ON public.workouts FOR SELECT
TO authenticated
USING (
  athlete_id = auth.uid() OR
  coach_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'coach'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS athlete 
      WHERE athlete.id = workouts.athlete_id 
      AND athlete.coach_id = auth.uid()
    )
  )
);

CREATE POLICY "Coaches can insert workouts"
ON public.workouts FOR INSERT
TO authenticated
WITH CHECK (
  coach_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'coach'
  )
);

CREATE POLICY "Coaches can update workouts they created"
ON public.workouts FOR UPDATE
TO authenticated
USING (
  coach_id = auth.uid() OR
  athlete_id = auth.uid()
)
WITH CHECK (
  coach_id = auth.uid() OR
  athlete_id = auth.uid()
);

CREATE POLICY "Coaches can delete their workouts"
ON public.workouts FOR DELETE
TO authenticated
USING (coach_id = auth.uid());

-- Create workout_logs table
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  rpe_global INTEGER CHECK (rpe_global >= 1 AND rpe_global <= 10),
  exercises_data JSONB NOT NULL DEFAULT '[]'::jsonb, -- Actual performed sets
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on workout_logs
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Athletes can manage their own logs, coaches can view
CREATE POLICY "Users can view workout logs"
ON public.workout_logs FOR SELECT
TO authenticated
USING (
  athlete_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'coach'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS athlete 
      WHERE athlete.id = workout_logs.athlete_id 
      AND athlete.coach_id = auth.uid()
    )
  )
);

CREATE POLICY "Athletes can insert their workout logs"
ON public.workout_logs FOR INSERT
TO authenticated
WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can update their workout logs"
ON public.workout_logs FOR UPDATE
TO authenticated
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
BEFORE UPDATE ON public.workouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();