-- Add secondary_muscles column for synergistic muscles
ALTER TABLE public.exercises 
ADD COLUMN secondary_muscles text[] NOT NULL DEFAULT '{}';

-- Add tracking_fields column for active metrics (e.g., 'reps', 'weight', 'rpe')
ALTER TABLE public.exercises 
ADD COLUMN tracking_fields text[] NOT NULL DEFAULT '{}';