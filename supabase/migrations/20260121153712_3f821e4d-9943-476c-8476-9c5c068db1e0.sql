-- Create invite_tokens table for secure athlete invitations
CREATE TABLE public.invite_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- Coaches can create invites
CREATE POLICY "Coaches can create invites"
ON public.invite_tokens
FOR INSERT
WITH CHECK (coach_id = auth.uid());

-- Coaches can view their own invites
CREATE POLICY "Coaches can view their invites"
ON public.invite_tokens
FOR SELECT
USING (coach_id = auth.uid());

-- Coaches can delete their own invites
CREATE POLICY "Coaches can delete their invites"
ON public.invite_tokens
FOR DELETE
USING (coach_id = auth.uid());

-- Coaches can update their invites (mark as used)
CREATE POLICY "Coaches can update their invites"
ON public.invite_tokens
FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Create function to link invite on signup (called from handle_new_user trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_name TEXT;
  invite_record RECORD;
  user_email TEXT;
BEGIN
  -- Sanitize and validate the full_name from metadata
  safe_name := COALESCE(TRIM(NEW.raw_user_meta_data->>'full_name'), '');
  
  -- Limit length to 100 characters to prevent excessive input
  safe_name := LEFT(safe_name, 100);
  
  -- Remove any null bytes or control characters
  safe_name := regexp_replace(safe_name, E'[\\x00-\\x1F\\x7F]', '', 'g');
  
  -- Get user email
  user_email := NEW.email;
  
  -- Check for pending invite for this email
  SELECT * INTO invite_record
  FROM public.invite_tokens
  WHERE email = user_email
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF invite_record IS NOT NULL THEN
    -- Create profile linked to coach from invite
    INSERT INTO public.profiles (id, full_name, role, coach_id, onboarding_completed)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(safe_name, ''), invite_record.full_name),
      'athlete',
      invite_record.coach_id,
      false
    );
    
    -- Mark invite as used
    UPDATE public.invite_tokens
    SET used = true
    WHERE id = invite_record.id;
  ELSE
    -- Standard profile creation
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NULLIF(safe_name, ''));
  END IF;
  
  RETURN NEW;
END;
$$;