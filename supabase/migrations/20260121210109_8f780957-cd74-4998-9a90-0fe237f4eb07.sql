-- Fix infinite recursion on public.profiles RLS by replacing policies with non-recursive rules

-- 1) Drop problematic/legacy policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view their athletes" ON public.profiles;
DROP POLICY IF EXISTS "Athletes can view their coach" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.profiles;

-- (Drop any other potential recursive policies that might exist from prior iterations)
DROP POLICY IF EXISTS "Users can view own profile or coach-athlete relationship" ON public.profiles;

-- 2) Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) Create simplified, non-recursive policies

-- READ: any authenticated user can read profiles (needed for branding/coach lookup)
CREATE POLICY "Allow read access for authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- INSERT: user can only create their own profile row
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: user can only update their own profile row
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);
