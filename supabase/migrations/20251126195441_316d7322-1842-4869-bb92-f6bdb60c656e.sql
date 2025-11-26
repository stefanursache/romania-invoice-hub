-- Add payment plan column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payment_plan text DEFAULT 'free' CHECK (payment_plan IN ('free', 'basic', 'pro', 'enterprise'));