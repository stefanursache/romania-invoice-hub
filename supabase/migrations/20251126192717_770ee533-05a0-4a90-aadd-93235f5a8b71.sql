-- Add SPV credentials to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS spv_client_id TEXT,
ADD COLUMN IF NOT EXISTS spv_client_secret TEXT,
ADD COLUMN IF NOT EXISTS spv_last_sync TIMESTAMP WITH TIME ZONE;