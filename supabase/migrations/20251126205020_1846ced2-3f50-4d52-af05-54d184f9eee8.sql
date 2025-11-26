-- Fix RLS policy to allow accountants to join via invitation codes

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Only owners can invite members" ON public.workspace_members;

-- Create new INSERT policy that allows both:
-- 1. Owners to invite members directly
-- 2. Accountants to add themselves using valid invitation codes
CREATE POLICY "Owners can invite and accountants can join with valid codes"
  ON public.workspace_members
  FOR INSERT
  WITH CHECK (
    -- Allow owners to invite anyone
    (workspace_owner_id = auth.uid())
    OR
    -- Allow accountants to add themselves if they have a valid unused invitation code
    (
      member_user_id = auth.uid()
      AND is_accountant(auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.invitation_codes ic
        WHERE ic.workspace_owner_id = workspace_members.workspace_owner_id
          AND ic.is_used = false
          AND ic.expires_at > now()
      )
    )
  );

-- Update the policy for marking codes as used to be more permissive
DROP POLICY IF EXISTS "Accountants can mark codes as used" ON public.invitation_codes;

CREATE POLICY "Accountants can mark codes as used when joining"
  ON public.invitation_codes
  FOR UPDATE
  USING (
    NOT is_used 
    AND expires_at > now()
    AND is_accountant(auth.uid())
  )
  WITH CHECK (
    is_used = true 
    AND used_by = auth.uid()
  );