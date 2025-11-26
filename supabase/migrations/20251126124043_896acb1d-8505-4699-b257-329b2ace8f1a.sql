-- Update RLS policy for business owners to view access requests
-- Simplify to just check if they're the business owner
DROP POLICY IF EXISTS "Business owners can view requests to them" ON public.access_requests;

CREATE POLICY "Business owners can view requests to them"
ON public.access_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = business_owner_id
);

-- Make sure business owners can see requests even before responding
-- This allows the query to work with .or() condition
DROP POLICY IF EXISTS "Business owners can view requests by email" ON public.access_requests;

CREATE POLICY "Business owners can view requests by email"
ON public.access_requests
FOR SELECT
TO authenticated
USING (
  business_owner_email IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);