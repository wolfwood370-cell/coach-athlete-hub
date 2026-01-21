-- 1. Drop existing policies to clear the recursion
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view their athletes" ON profiles;
DROP POLICY IF EXISTS "Athletes can view their coach" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile or coach-athlete relationship" ON profiles;

-- 2. Enable RLS (just to be safe)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create CLEAN, NON-RECURSIVE policies

-- POLICY A: READ (Select)
-- Allow any authenticated user to read profiles (no table self-reference = no recursion)
CREATE POLICY "Profiles are viewable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- POLICY B: INSERT (Create)
-- Users can only create a profile with their own ID
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- POLICY C: UPDATE (Edit)
-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);