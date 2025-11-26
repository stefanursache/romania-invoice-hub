-- Function to create standard Romanian chart of accounts for a user
CREATE OR REPLACE FUNCTION public.create_standard_romanian_accounts(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already has accounts
  IF EXISTS (SELECT 1 FROM public.accounts WHERE user_id = _user_id) THEN
    RETURN;
  END IF;

  -- Insert standard Romanian accounts
  INSERT INTO public.accounts (user_id, account_code, account_name, account_type) VALUES
    -- Assets (Active)
    (_user_id, '5121', 'Conturi la bănci în lei', 'asset'),
    (_user_id, '531', 'Casa în lei', 'asset'),
    (_user_id, '411', 'Clienți', 'asset'),
    (_user_id, '4426', 'TVA deductibilă', 'asset'),
    (_user_id, '3011', 'Materii prime', 'asset'),
    
    -- Liabilities (Pasive)
    (_user_id, '401', 'Furnizori', 'liability'),
    (_user_id, '4111', 'Furnizori - facturi nesosite', 'liability'),
    (_user_id, '4427', 'TVA colectată', 'liability'),
    (_user_id, '419', 'Clienți creditori', 'liability'),
    
    -- Equity (Capital)
    (_user_id, '1012', 'Capital subscris vărsat', 'equity'),
    (_user_id, '117', 'Rezultatul reportat', 'equity'),
    
    -- Revenue (Venituri)
    (_user_id, '707', 'Venituri din vânzarea mărfurilor', 'revenue'),
    (_user_id, '704', 'Venituri din lucrări executate și servicii prestate', 'revenue'),
    (_user_id, '706', 'Venituri din redevenţe, locaţii de gestiune şi chirii', 'revenue'),
    
    -- Expenses (Cheltuieli)
    (_user_id, '607', 'Cheltuieli privind mărfurile', 'expense'),
    (_user_id, '628', 'Alte cheltuieli cu serviciile executate de terți', 'expense'),
    (_user_id, '635', 'Cheltuieli cu alte impozite, taxe și vărsăminte asimilate', 'expense'),
    (_user_id, '6058', 'Alte cheltuieli de personal', 'expense'),
    (_user_id, '611', 'Cheltuieli cu întreținerea și reparațiile', 'expense'),
    (_user_id, '626', 'Cheltuieli poștale și taxe de telecomunicații', 'expense');
END;
$$;

-- Trigger function to create accounts when a new profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_standard_romanian_accounts(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
CREATE TRIGGER on_profile_created_create_accounts
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_accounts();

-- Backfill existing users who don't have accounts yet
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM public.profiles 
    WHERE NOT EXISTS (
      SELECT 1 FROM public.accounts WHERE user_id = profiles.id
    )
  LOOP
    PERFORM public.create_standard_romanian_accounts(user_record.id);
  END LOOP;
END;
$$;