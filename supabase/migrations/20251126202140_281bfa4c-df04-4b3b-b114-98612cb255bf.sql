-- Fix profiles RLS policies to allow accountants to update business profiles they have access to

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new update policy that allows:
-- 1. Users to update their own profile
-- 2. Accountants to update profiles of businesses they have workspace access to
CREATE POLICY "Users can update own profile or as accountant" 
ON public.profiles
FOR UPDATE 
USING (
  (auth.uid() = id) 
  OR 
  (EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_members.workspace_owner_id = profiles.id
      AND workspace_members.member_user_id = auth.uid()
      AND workspace_members.role = 'accountant'
  ))
)
WITH CHECK (
  (auth.uid() = id) 
  OR 
  (EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_members.workspace_owner_id = profiles.id
      AND workspace_members.member_user_id = auth.uid()
      AND workspace_members.role = 'accountant'
  ))
);