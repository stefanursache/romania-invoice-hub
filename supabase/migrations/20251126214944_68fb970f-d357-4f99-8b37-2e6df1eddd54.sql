-- =====================================================
-- CRITICAL SECURITY FIX: Restrict profiles table access
-- =====================================================

-- Drop overly permissive admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create more restrictive policy: admins can only view their own profile
-- They should not have blanket access to all business data
CREATE POLICY "Admins can view own profile only"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Update the accountant policy to be more explicit about workspace access
DROP POLICY IF EXISTS "Users can view own profile or as accountant" ON public.profiles;

CREATE POLICY "Users can view own profile or authorized workspace profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1
      FROM public.workspace_members
      WHERE workspace_members.workspace_owner_id = profiles.id
        AND workspace_members.member_user_id = auth.uid()
        AND workspace_members.role = 'accountant'::app_role
    )
  );

-- =====================================================
-- CRITICAL SECURITY FIX: Restrict clients table access
-- =====================================================

-- Drop overly permissive admin policy
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;

-- Ensure RLS is enabled on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Recreate strict client access policy
CREATE POLICY "Users can only view their own clients"
  ON public.clients
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR has_workspace_access(user_id, auth.uid())
  );

-- Add comment explaining the security model
COMMENT ON TABLE public.profiles IS 'Contains sensitive business data. Access restricted to profile owner and their authorized accountants only.';
COMMENT ON TABLE public.clients IS 'Contains sensitive customer data. Access restricted to business owner and their authorized accountants only.';

-- Verify no public access
-- These tables should NEVER be accessible without authentication
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;
REVOKE ALL ON public.clients FROM anon;
REVOKE ALL ON public.clients FROM public;