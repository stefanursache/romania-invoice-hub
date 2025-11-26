-- Storage policies for accountants to access bank statements
-- Accountants need read access to bank statements for companies they manage

-- Policy for accountants to download bank statements
CREATE POLICY "Accountants can download bank statements for their companies"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'bank-statements'
  AND (
    -- Owner can access their own files
    (storage.foldername(name))[1]::uuid = auth.uid()
    OR
    -- Accountants can access files from companies they manage
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_owner_id = (storage.foldername(name))[1]::uuid
      AND member_user_id = auth.uid()
    )
  )
);