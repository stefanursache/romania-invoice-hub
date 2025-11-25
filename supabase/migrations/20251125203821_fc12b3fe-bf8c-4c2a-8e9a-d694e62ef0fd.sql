-- Add accounts table for chart of accounts (future extensibility)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, account_code)
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
ON public.accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
ON public.accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
ON public.accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
ON public.accounts FOR DELETE
USING (auth.uid() = user_id);

-- Add SAF-T exports table for tracking generated exports
CREATE TABLE public.saft_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_data TEXT NOT NULL,
  status TEXT DEFAULT 'generated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.saft_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SAF-T exports"
ON public.saft_exports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SAF-T exports"
ON public.saft_exports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own SAF-T exports"
ON public.saft_exports FOR DELETE
USING (auth.uid() = user_id);

-- Update profiles table to ensure we have all required fields for SAF-T
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Romania',
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Add trigger for accounts updated_at
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();