-- Create storage bucket for bank statements
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-statements', 'bank-statements', false);

-- Create bank_statements table
CREATE TABLE public.bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  statement_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_statements
CREATE POLICY "Users can view own bank statements"
ON public.bank_statements
FOR SELECT
USING (auth.uid() = user_id OR has_workspace_access(user_id, auth.uid()));

CREATE POLICY "Users can insert own bank statements"
ON public.bank_statements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank statements"
ON public.bank_statements
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank statements"
ON public.bank_statements
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for bank-statements bucket
CREATE POLICY "Users can upload own bank statements"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'bank-statements' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own bank statements or as accountant"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'bank-statements' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (
     SELECT 1 FROM public.workspace_members
     WHERE workspace_owner_id::text = (storage.foldername(name))[1]
       AND member_user_id = auth.uid()
   ))
);

CREATE POLICY "Users can delete own bank statements"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'bank-statements' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create currency_rates table for conversion
CREATE TABLE public.currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code TEXT NOT NULL,
  rate_to_ron NUMERIC(10, 4) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(currency_code)
);

-- Insert default rates (these should be updated regularly in production)
INSERT INTO public.currency_rates (currency_code, rate_to_ron) VALUES
('RON', 1.0000),
('EUR', 4.9700),
('USD', 4.5500),
('GBP', 5.7500);

-- Make currency_rates publicly readable (no sensitive data)
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view currency rates"
ON public.currency_rates
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_bank_statements_updated_at
BEFORE UPDATE ON public.bank_statements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();