-- Add branding and preferences columns to profiles table for coaches
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{"unit": "kg", "checkin_day": 1, "email_notifications": true, "notifications": {"new_message": true, "workout_completed": true, "missed_workout": true}}';

-- Create storage bucket for coach logos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-logos', 'coach-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for coach avatars (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-avatars', 'coach-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for coach-logos bucket
CREATE POLICY "Logos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'coach-logos');

CREATE POLICY "Coaches can upload their own logo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'coach-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Coaches can update their own logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'coach-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Coaches can delete their own logo"
ON storage.objects FOR DELETE
USING (bucket_id = 'coach-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for coach-avatars bucket
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'coach-avatars');

CREATE POLICY "Coaches can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'coach-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Coaches can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'coach-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Coaches can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'coach-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);