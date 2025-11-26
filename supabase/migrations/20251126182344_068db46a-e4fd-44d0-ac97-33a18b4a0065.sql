-- Add explicit policies to deny public/anonymous access to all sensitive tables
-- This ensures only authenticated users with proper permissions can access data

-- Ensure profiles table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.profiles;
CREATE POLICY "Deny anonymous access" 
ON public.profiles 
AS RESTRICTIVE
FOR ALL 
TO anon 
USING (false);

-- Ensure clients table is properly secured  
DROP POLICY IF EXISTS "Deny anonymous access" ON public.clients;
CREATE POLICY "Deny anonymous access"
ON public.clients
AS RESTRICTIVE  
FOR ALL
TO anon
USING (false);

-- Ensure invoices table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.invoices;
CREATE POLICY "Deny anonymous access"
ON public.invoices
AS RESTRICTIVE
FOR ALL  
TO anon
USING (false);

-- Ensure invoice_items table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.invoice_items;
CREATE POLICY "Deny anonymous access"
ON public.invoice_items
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Ensure expenses table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.expenses;
CREATE POLICY "Deny anonymous access"
ON public.expenses
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Ensure bank_statements table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.bank_statements;
CREATE POLICY "Deny anonymous access"
ON public.bank_statements
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Ensure access_requests table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.access_requests;
CREATE POLICY "Deny anonymous access"
ON public.access_requests
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Ensure audit_logs table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.audit_logs;
CREATE POLICY "Deny anonymous access"
ON public.audit_logs
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Ensure user_sessions table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.user_sessions;
CREATE POLICY "Deny anonymous access"
ON public.user_sessions
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Ensure saft_exports table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.saft_exports;
CREATE POLICY "Deny anonymous access"
ON public.saft_exports
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Ensure accounts table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.accounts;
CREATE POLICY "Deny anonymous access"
ON public.accounts
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Ensure user_roles table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.user_roles;
CREATE POLICY "Deny anonymous access"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Ensure workspace_members table is properly secured
DROP POLICY IF EXISTS "Deny anonymous access" ON public.workspace_members;
CREATE POLICY "Deny anonymous access"
ON public.workspace_members
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Comment explaining the security model
COMMENT ON TABLE public.profiles IS 'Contains sensitive business information. Access restricted to authenticated users only via RLS policies.';
COMMENT ON TABLE public.clients IS 'Contains customer contact information. Access restricted to business owners and authorized accountants only.';
COMMENT ON TABLE public.invoices IS 'Contains financial data. Access restricted to business owners and authorized accountants only.';