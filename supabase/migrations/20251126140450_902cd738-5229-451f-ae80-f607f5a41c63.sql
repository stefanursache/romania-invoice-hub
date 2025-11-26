-- ============================================
-- SECURITY IMPROVEMENTS MIGRATION
-- Addresses multiple security vulnerabilities
-- ============================================

-- 1. Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  operation text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and the user themselves can view their audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Add UPDATE and DELETE policies for user_roles table
-- Allow users to update their own role (with restrictions)
CREATE POLICY "Users cannot change their own role"
  ON public.user_roles
  FOR UPDATE
  USING (false); -- Prevent self-service role changes

-- Allow system to delete roles on user deletion (handled by cascade)
CREATE POLICY "System can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (false); -- Roles should only be deleted via user deletion cascade

-- 3. Add UPDATE policy for workspace_members
-- Allow workspace owners to update member roles
CREATE POLICY "Workspace owners can update member roles"
  ON public.workspace_members
  FOR UPDATE
  USING (auth.uid() = workspace_owner_id)
  WITH CHECK (auth.uid() = workspace_owner_id);

-- 4. Add UPDATE policy for saft_exports
-- Allow users to update their own exports (e.g., fix errors)
CREATE POLICY "Users can update their own exports"
  ON public.saft_exports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Add DELETE policy for profiles (GDPR compliance)
-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- 6. Strengthen storage RLS for bank-statements bucket
-- Create policies for bank-statements storage bucket
CREATE POLICY "Users can view their own bank statements"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'bank-statements' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.has_workspace_access(
        (storage.foldername(name))[1]::uuid,
        auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload their own bank statements"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'bank-statements' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own bank statements"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'bank-statements' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own bank statements"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'bank-statements' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 7. Add rate limiting table to prevent abuse
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, action)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
  ON public.rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- 8. Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _action text,
  _max_attempts integer,
  _window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
  _window_start timestamptz;
BEGIN
  -- Get current count for this action
  SELECT count, window_start INTO _count, _window_start
  FROM public.rate_limits
  WHERE user_id = _user_id AND action = _action;
  
  -- If no record exists or window expired, create/reset
  IF _count IS NULL OR _window_start < (now() - (_window_minutes || ' minutes')::interval) THEN
    INSERT INTO public.rate_limits (user_id, action, count, window_start)
    VALUES (_user_id, _action, 1, now())
    ON CONFLICT (user_id, action) 
    DO UPDATE SET count = 1, window_start = now();
    RETURN true;
  END IF;
  
  -- Check if limit exceeded
  IF _count >= _max_attempts THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  UPDATE public.rate_limits
  SET count = count + 1
  WHERE user_id = _user_id AND action = _action;
  
  RETURN true;
END;
$$;

-- 9. Add trigger function for audit logging
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the operation
  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    operation,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 10. Add audit triggers to sensitive tables
CREATE TRIGGER audit_access_requests
  AFTER INSERT OR UPDATE OR DELETE ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_workspace_members
  AFTER INSERT OR UPDATE OR DELETE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 11. Create function to get sanitized profile data
-- This function allows accountants to see only necessary contact info
CREATE OR REPLACE FUNCTION public.get_client_contact_sanitized(
  _workspace_owner_id uuid
)
RETURNS TABLE (
  id uuid,
  company_name text,
  city text,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.company_name,
    p.city,
    p.country
  FROM public.profiles p
  WHERE p.id = _workspace_owner_id
    AND public.has_workspace_access(_workspace_owner_id, auth.uid());
$$;

-- 12. Restrict currency_rates to authenticated users only
DROP POLICY IF EXISTS "Anyone can view currency rates" ON public.currency_rates;

CREATE POLICY "Authenticated users can view currency rates"
  ON public.currency_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- 13. Add session tracking table for security monitoring
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ip_address inet,
  user_agent text,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 14. Add indexes for performance on security-related queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity DESC);

-- 15. Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Tracks all sensitive operations for security auditing';
COMMENT ON TABLE public.rate_limits IS 'Prevents abuse by rate limiting user actions';
COMMENT ON TABLE public.user_sessions IS 'Tracks user sessions for security monitoring';
COMMENT ON FUNCTION public.check_rate_limit IS 'Validates if user has exceeded rate limit for an action';
COMMENT ON FUNCTION public.get_client_contact_sanitized IS 'Returns sanitized contact information for accountants';