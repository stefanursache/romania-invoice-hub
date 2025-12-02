-- Add full_name column to profiles table for personal account info
ALTER TABLE public.profiles 
ADD COLUMN full_name text;