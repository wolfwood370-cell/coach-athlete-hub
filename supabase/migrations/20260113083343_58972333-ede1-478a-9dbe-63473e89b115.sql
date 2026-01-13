-- Remove the FK constraint on profiles.id -> auth.users.id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;