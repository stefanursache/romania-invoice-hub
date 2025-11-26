-- Allow accountants to modify chart of accounts for their clients
-- Drop the old restrictive UPDATE policy on accounts
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;

-- Create new UPDATE policy that allows accountants to update
CREATE POLICY "Users can update own accounts or as accountant"
  ON public.accounts
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR has_workspace_access(user_id, auth.uid())
  );

-- Also update INSERT policy to allow accountants to add accounts
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;

CREATE POLICY "Users can insert own accounts or as accountant"
  ON public.accounts
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR has_workspace_access(user_id, auth.uid())
  );

-- Also update DELETE policy to allow accountants to delete accounts
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;

CREATE POLICY "Users can delete own accounts or as accountant"
  ON public.accounts
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR has_workspace_access(user_id, auth.uid())
  );