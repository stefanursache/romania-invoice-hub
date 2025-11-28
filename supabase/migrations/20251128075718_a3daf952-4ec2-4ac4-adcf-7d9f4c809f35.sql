-- Drop the restrictive admin policy
DROP POLICY IF EXISTS "Admins can view own profile only" ON public.profiles;

-- Create a new policy that allows admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin(auth.uid()));