-- Fix Security Issues: 4 error-level vulnerabilities

-- ============================================
-- 1. FIX: get_or_create_direct_room RPC function
-- Add caller validation and coach-athlete relationship check
-- ============================================
CREATE OR REPLACE FUNCTION public.get_or_create_direct_room(user_a UUID, user_b UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_room_id UUID;
  new_room_id UUID;
  caller_id UUID;
BEGIN
  caller_id := auth.uid();
  
  -- Validate caller is authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Validate caller is one of the participants
  IF caller_id != user_a AND caller_id != user_b THEN
    RAISE EXCEPTION 'Unauthorized: caller must be a participant';
  END IF;
  
  -- Validate cannot create room with self
  IF user_a = user_b THEN
    RAISE EXCEPTION 'Cannot create room with self';
  END IF;
  
  -- Validate coach-athlete relationship exists between user_a and user_b
  IF NOT EXISTS (
    SELECT 1 FROM profiles p1
    INNER JOIN profiles p2 ON (p1.coach_id = p2.id OR p2.coach_id = p1.id)
    WHERE p1.id = user_a AND p2.id = user_b
  ) THEN
    RAISE EXCEPTION 'No coach-athlete relationship exists between these users';
  END IF;

  -- Check if a direct room already exists between these two users
  SELECT cr.id INTO existing_room_id
  FROM chat_rooms cr
  WHERE cr.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM chat_participants cp1
    WHERE cp1.room_id = cr.id AND cp1.user_id = user_a
  )
  AND EXISTS (
    SELECT 1 FROM chat_participants cp2
    WHERE cp2.room_id = cr.id AND cp2.user_id = user_b
  )
  LIMIT 1;

  IF existing_room_id IS NOT NULL THEN
    RETURN existing_room_id;
  END IF;

  -- Create a new direct room
  INSERT INTO chat_rooms (type)
  VALUES ('direct')
  RETURNING id INTO new_room_id;

  -- Add both participants
  INSERT INTO chat_participants (room_id, user_id)
  VALUES (new_room_id, user_a), (new_room_id, user_b);

  RETURN new_room_id;
END;
$$;

-- ============================================
-- 2. FIX: Profiles table SELECT policy
-- Restrict to: own profile, athletes assigned to coach, or your coach's profile
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;

-- Create restrictive policy: users can only see relevant profiles
CREATE POLICY "Users can view relevant profiles"
ON profiles
FOR SELECT
USING (
  -- Users can always see their own profile
  auth.uid() = id
  OR
  -- Coaches can see profiles of athletes assigned to them
  (
    EXISTS (
      SELECT 1 FROM profiles viewer
      WHERE viewer.id = auth.uid()
      AND viewer.role = 'coach'
    )
    AND coach_id = auth.uid()
  )
  OR
  -- Athletes can see their coach's profile
  (
    EXISTS (
      SELECT 1 FROM profiles viewer
      WHERE viewer.id = auth.uid()
      AND viewer.role = 'athlete'
      AND viewer.coach_id = profiles.id
    )
  )
);

-- ============================================
-- 3. FIX: chat_rooms INSERT policy
-- Restrict to only allow room creation through the validated RPC function
-- The RPC function now handles all validation, so we remove direct INSERT
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON chat_rooms;

-- Create restrictive policy: only system (SECURITY DEFINER functions) can create rooms
-- Regular users cannot create rooms directly; they must use get_or_create_direct_room RPC
CREATE POLICY "System can create rooms via RPC"
ON chat_rooms
FOR INSERT
WITH CHECK (false);

-- ============================================
-- 4. FIX: chat_participants INSERT policy  
-- Restrict to only allow adding yourself to rooms you're being added to via RPC
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can add participants to rooms they're in" ON chat_participants;

-- Create restrictive policy: only system (SECURITY DEFINER functions) can add participants
-- The RPC function handles all participant additions with proper validation
CREATE POLICY "System can add participants via RPC"
ON chat_participants
FOR INSERT
WITH CHECK (false);