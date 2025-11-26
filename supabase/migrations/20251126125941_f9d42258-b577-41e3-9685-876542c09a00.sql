-- Update RLS policy for accounts table to allow accountants to view
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;

CREATE POLICY "Users can view own accounts or as accountant"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR has_workspace_access(user_id, auth.uid())
);

-- Update RLS policy for saft_exports table to allow accountants to view
DROP POLICY IF EXISTS "Users can view own SAF-T exports" ON public.saft_exports;

CREATE POLICY "Users can view own SAF-T exports or as accountant"
ON public.saft_exports
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR has_workspace_access(user_id, auth.uid())
);

-- Update RLS policy for profiles table to allow accountants to view
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or as accountant"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_owner_id = profiles.id
      AND member_user_id = auth.uid()
  )
);