CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'owner',
    'accountant',
    'admin'
);


--
-- Name: backfill_profile_emails(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.backfill_profile_emails() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
END;
$$;


--
-- Name: check_rate_limit(uuid, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_rate_limit(_user_id uuid, _action text, _max_attempts integer, _window_minutes integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: create_standard_romanian_accounts(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_standard_romanian_accounts(_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: generate_invitation_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invitation_code() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.invitation_codes WHERE code = new_code) INTO code_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;


--
-- Name: get_business_user_by_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_business_user_by_email(user_email text) RETURNS TABLE(user_id uuid, email text, company_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    COALESCE(p.email, u.email) AS email,
    COALESCE(p.company_name, 'My Company') AS company_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  INNER JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE LOWER(COALESCE(p.email, u.email)) = LOWER(user_email)
    AND ur.role = 'business';
END;
$$;


--
-- Name: get_client_contact_sanitized(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_contact_sanitized(_workspace_owner_id uuid) RETURNS TABLE(id uuid, company_name text, city text, country text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id;
$$;


--
-- Name: get_workspace_role(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_workspace_role(_workspace_owner_id uuid, _user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT role FROM public.workspace_members 
     WHERE workspace_owner_id = _workspace_owner_id AND member_user_id = _user_id),
    CASE WHEN _workspace_owner_id = _user_id THEN 'owner'::public.app_role ELSE NULL END
  );
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
    NEW.email
  );
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_accounts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_accounts() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.create_standard_romanian_accounts(NEW.id);
  RETURN NEW;
END;
$$;


--
-- Name: has_workspace_access(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_workspace_access(_workspace_owner_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_owner_id = _workspace_owner_id
      AND member_user_id = _user_id
  ) OR _workspace_owner_id = _user_id;
$$;


--
-- Name: is_accountant(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_accountant(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'accountant'
  );
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  );
$$;


--
-- Name: is_business(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_business(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'business'
  );
$$;


--
-- Name: log_audit_event(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_audit_event() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_product_stock_after_movement(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_product_stock_after_movement() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.products
    SET current_stock = current_stock + 
      CASE 
        WHEN NEW.movement_type = 'in' THEN NEW.quantity
        WHEN NEW.movement_type = 'out' THEN -NEW.quantity
        WHEN NEW.movement_type = 'adjustment' THEN NEW.quantity
        ELSE 0
      END
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: access_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    accountant_user_id uuid NOT NULL,
    business_owner_email text NOT NULL,
    business_owner_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT access_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    account_code text NOT NULL,
    account_name text NOT NULL,
    account_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    table_name text NOT NULL,
    operation text NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bank_statements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_statements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    upload_date timestamp with time zone DEFAULT now() NOT NULL,
    statement_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    cui_cif text,
    reg_com text,
    address text,
    email text,
    phone text,
    payment_terms integer DEFAULT 30,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: currency_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currency_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    currency_code text NOT NULL,
    rate_to_ron numeric(10,4) NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    expense_date date NOT NULL,
    merchant text NOT NULL,
    category text NOT NULL,
    amount numeric NOT NULL,
    vat_amount numeric DEFAULT 0 NOT NULL,
    currency text DEFAULT 'RON'::text NOT NULL,
    description text,
    notes text,
    image_url text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invitation_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    workspace_owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    used_by uuid,
    used_at timestamp with time zone
);


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    vat_rate integer DEFAULT 19 NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    vat_amount numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    invoice_number text NOT NULL,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date NOT NULL,
    currency text DEFAULT 'RON'::text,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    vat_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    invoice_type text DEFAULT 'invoice'::text,
    accountant_approved boolean DEFAULT false,
    approved_by uuid,
    approved_at timestamp with time zone,
    approval_notes text,
    CONSTRAINT invoices_invoice_type_check CHECK ((invoice_type = ANY (ARRAY['invoice'::text, 'proforma'::text]))),
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text])))
);


--
-- Name: payment_gateway_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_gateway_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gateway_name text DEFAULT 'stripe'::text NOT NULL,
    api_key_encrypted text,
    publishable_key text,
    webhook_secret text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_payment_id text,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text,
    status text NOT NULL,
    payment_method text,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    retry_available boolean DEFAULT true,
    last_retry_at timestamp with time zone
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    sku text,
    description text,
    category text,
    unit_of_measure text DEFAULT 'buc'::text NOT NULL,
    current_stock numeric DEFAULT 0 NOT NULL,
    minimum_stock numeric DEFAULT 0,
    purchase_price numeric DEFAULT 0 NOT NULL,
    sale_price numeric DEFAULT 0 NOT NULL,
    vat_rate integer DEFAULT 19 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    company_name text NOT NULL,
    cui_cif text,
    reg_com text,
    address text,
    bank_account text,
    logo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    phone text,
    email text,
    city text,
    county text,
    country text DEFAULT 'Romania'::text,
    postal_code text,
    spv_client_id text,
    spv_client_secret text,
    spv_last_sync timestamp with time zone,
    payment_plan text DEFAULT 'free'::text,
    CONSTRAINT profiles_payment_plan_check CHECK ((payment_plan = ANY (ARRAY['free'::text, 'basic'::text, 'pro'::text, 'enterprise'::text])))
);


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: saft_exports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saft_exports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    period_from date NOT NULL,
    period_to date NOT NULL,
    generated_at timestamp with time zone DEFAULT now(),
    file_data text NOT NULL,
    status text DEFAULT 'generated'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    movement_type text NOT NULL,
    quantity numeric NOT NULL,
    unit_price numeric,
    reference_type text,
    reference_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    CONSTRAINT stock_movements_movement_type_check CHECK ((movement_type = ANY (ARRAY['in'::text, 'out'::text, 'adjustment'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['business'::text, 'accountant'::text, 'owner'::text, 'admin'::text])))
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ip_address inet,
    user_agent text,
    last_activity timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_subscription_id text,
    stripe_customer_id text,
    plan_name text NOT NULL,
    status text NOT NULL,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id text NOT NULL,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    processed_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'processed'::text NOT NULL,
    error_message text,
    retry_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: workspace_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_owner_id uuid NOT NULL,
    member_user_id uuid NOT NULL,
    role public.app_role DEFAULT 'accountant'::public.app_role NOT NULL,
    invited_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: access_requests access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_user_id_account_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_account_code_key UNIQUE (user_id, account_code);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bank_statements bank_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_statements
    ADD CONSTRAINT bank_statements_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: currency_rates currency_rates_currency_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_rates
    ADD CONSTRAINT currency_rates_currency_code_key UNIQUE (currency_code);


--
-- Name: currency_rates currency_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_rates
    ADD CONSTRAINT currency_rates_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: invitation_codes invitation_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_codes
    ADD CONSTRAINT invitation_codes_code_key UNIQUE (code);


--
-- Name: invitation_codes invitation_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_codes
    ADD CONSTRAINT invitation_codes_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_user_id_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_invoice_number_key UNIQUE (user_id, invoice_number);


--
-- Name: payment_gateway_config payment_gateway_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_gateway_config
    ADD CONSTRAINT payment_gateway_config_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_user_id_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_user_id_sku_key UNIQUE (user_id, sku);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_user_id_action_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_user_id_action_key UNIQUE (user_id, action);


--
-- Name: saft_exports saft_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saft_exports
    ADD CONSTRAINT saft_exports_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: webhook_events webhook_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_event_id_key UNIQUE (event_id);


--
-- Name: webhook_events webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);


--
-- Name: workspace_members workspace_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_pkey PRIMARY KEY (id);


--
-- Name: workspace_members workspace_members_workspace_owner_id_member_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_workspace_owner_id_member_user_id_key UNIQUE (workspace_owner_id, member_user_id);


--
-- Name: idx_access_requests_accountant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_requests_accountant ON public.access_requests USING btree (accountant_user_id);


--
-- Name: idx_access_requests_business_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_requests_business_owner ON public.access_requests USING btree (business_owner_id);


--
-- Name: idx_access_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_requests_status ON public.access_requests USING btree (status);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date DESC);


--
-- Name: idx_expenses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_user_id ON public.expenses USING btree (user_id);


--
-- Name: idx_invitation_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitation_codes_code ON public.invitation_codes USING btree (code);


--
-- Name: idx_invitation_codes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitation_codes_expires_at ON public.invitation_codes USING btree (expires_at);


--
-- Name: idx_invoices_approval; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_approval ON public.invoices USING btree (accountant_approved, user_id);


--
-- Name: idx_payment_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_status ON public.payment_transactions USING btree (status);


--
-- Name: idx_payment_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions USING btree (user_id);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_sku ON public.products USING btree (user_id, sku);


--
-- Name: idx_products_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_user_id ON public.products USING btree (user_id);


--
-- Name: idx_rate_limits_user_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_user_action ON public.rate_limits USING btree (user_id, action);


--
-- Name: idx_stock_movements_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_created_at ON public.stock_movements USING btree (created_at DESC);


--
-- Name: idx_stock_movements_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_product_id ON public.stock_movements USING btree (product_id);


--
-- Name: idx_stock_movements_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_user_id ON public.stock_movements USING btree (user_id);


--
-- Name: idx_user_sessions_last_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions USING btree (last_activity DESC);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_user_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status);


--
-- Name: idx_user_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);


--
-- Name: idx_webhook_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_events_created_at ON public.webhook_events USING btree (created_at DESC);


--
-- Name: idx_webhook_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_events_event_type ON public.webhook_events USING btree (event_type);


--
-- Name: idx_webhook_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_events_status ON public.webhook_events USING btree (status);


--
-- Name: access_requests audit_access_requests; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_access_requests AFTER INSERT OR DELETE OR UPDATE ON public.access_requests FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();


--
-- Name: user_roles audit_user_roles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_user_roles AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();


--
-- Name: workspace_members audit_workspace_members; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_workspace_members AFTER INSERT OR DELETE OR UPDATE ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();


--
-- Name: profiles on_profile_created_create_accounts; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_profile_created_create_accounts AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_accounts();


--
-- Name: stock_movements trigger_update_product_stock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_product_stock AFTER INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.update_product_stock_after_movement();


--
-- Name: accounts update_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: bank_statements update_bank_statements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bank_statements_updated_at BEFORE UPDATE ON public.bank_statements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: expenses update_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: rate_limits rate_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_member_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_member_user_id_fkey FOREIGN KEY (member_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_workspace_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_workspace_owner_id_fkey FOREIGN KEY (workspace_owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: access_requests Accountants can create access requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Accountants can create access requests" ON public.access_requests FOR INSERT TO authenticated WITH CHECK (((auth.uid() = accountant_user_id) AND public.is_accountant(auth.uid())));


--
-- Name: invitation_codes Accountants can mark codes as used when joining; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Accountants can mark codes as used when joining" ON public.invitation_codes FOR UPDATE USING (((NOT is_used) AND (expires_at > now()) AND public.is_accountant(auth.uid()))) WITH CHECK (((is_used = true) AND (used_by = auth.uid())));


--
-- Name: access_requests Accountants can view own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Accountants can view own requests" ON public.access_requests FOR SELECT TO authenticated USING ((auth.uid() = accountant_user_id));


--
-- Name: user_roles Admins can manage user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage user roles" ON public.user_roles TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: webhook_events Admins can manage webhook events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage webhook events" ON public.webhook_events USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: access_requests Admins can view all access requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all access requests" ON public.access_requests FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: expenses Admins can view all expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: invoices Admins can view all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all invoices" ON public.invoices FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: user_subscriptions Admins can view all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: payment_transactions Admins can view all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all transactions" ON public.payment_transactions FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can view all user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: webhook_events Admins can view all webhook events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all webhook events" ON public.webhook_events FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: workspace_members Admins can view all workspace members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all workspace members" ON public.workspace_members FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: profiles Admins can view own profile only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view own profile only" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: invitation_codes Anyone can view valid codes for joining; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view valid codes for joining" ON public.invitation_codes FOR SELECT TO authenticated USING (((NOT is_used) AND (expires_at > now())));


--
-- Name: currency_rates Authenticated users can view currency rates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view currency rates" ON public.currency_rates FOR SELECT TO authenticated USING (true);


--
-- Name: access_requests Business owners can respond to requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can respond to requests" ON public.access_requests FOR UPDATE TO authenticated USING (((auth.uid() = business_owner_id) OR (auth.uid() IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.email = access_requests.business_owner_email))))) WITH CHECK (((auth.uid() = business_owner_id) OR (auth.uid() IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.email = access_requests.business_owner_email)))));


--
-- Name: access_requests Business owners can view requests by email; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can view requests by email" ON public.access_requests FOR SELECT TO authenticated USING ((lower(business_owner_email) IN ( SELECT lower(profiles.email) AS lower
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: access_requests Business owners can view requests to them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business owners can view requests to them" ON public.access_requests FOR SELECT TO authenticated USING ((auth.uid() = business_owner_id));


--
-- Name: access_requests Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.access_requests AS RESTRICTIVE TO anon USING (false);


--
-- Name: accounts Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.accounts AS RESTRICTIVE TO anon USING (false);


--
-- Name: audit_logs Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.audit_logs AS RESTRICTIVE TO anon USING (false);


--
-- Name: bank_statements Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.bank_statements AS RESTRICTIVE TO anon USING (false);


--
-- Name: clients Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.clients AS RESTRICTIVE TO anon USING (false);


--
-- Name: expenses Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.expenses AS RESTRICTIVE TO anon USING (false);


--
-- Name: invitation_codes Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.invitation_codes TO anon USING (false);


--
-- Name: invoice_items Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.invoice_items AS RESTRICTIVE TO anon USING (false);


--
-- Name: invoices Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.invoices AS RESTRICTIVE TO anon USING (false);


--
-- Name: products Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.products USING (false);


--
-- Name: profiles Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.profiles AS RESTRICTIVE TO anon USING (false);


--
-- Name: saft_exports Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.saft_exports AS RESTRICTIVE TO anon USING (false);


--
-- Name: stock_movements Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.stock_movements USING (false);


--
-- Name: user_roles Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.user_roles AS RESTRICTIVE TO anon USING (false);


--
-- Name: user_sessions Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.user_sessions AS RESTRICTIVE TO anon USING (false);


--
-- Name: workspace_members Deny anonymous access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny anonymous access" ON public.workspace_members AS RESTRICTIVE TO anon USING (false);


--
-- Name: payment_gateway_config Only admins can manage payment config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can manage payment config" ON public.payment_gateway_config USING (public.is_admin(auth.uid()));


--
-- Name: workspace_members Only owners can remove members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only owners can remove members" ON public.workspace_members FOR DELETE USING ((workspace_owner_id = auth.uid()));


--
-- Name: invitation_codes Owners can create codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can create codes" ON public.invitation_codes FOR INSERT TO authenticated WITH CHECK ((workspace_owner_id = auth.uid()));


--
-- Name: workspace_members Owners can invite and accountants can join with valid codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can invite and accountants can join with valid codes" ON public.workspace_members FOR INSERT WITH CHECK (((workspace_owner_id = auth.uid()) OR ((member_user_id = auth.uid()) AND public.is_accountant(auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.invitation_codes ic
  WHERE ((ic.workspace_owner_id = workspace_members.workspace_owner_id) AND (ic.is_used = false) AND (ic.expires_at > now())))))));


--
-- Name: invitation_codes Owners can view their own codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view their own codes" ON public.invitation_codes FOR SELECT TO authenticated USING ((workspace_owner_id = auth.uid()));


--
-- Name: user_roles System can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can delete roles" ON public.user_roles FOR DELETE USING (false);


--
-- Name: saft_exports Users can delete own SAF-T exports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own SAF-T exports" ON public.saft_exports FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: accounts Users can delete own accounts or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own accounts or as accountant" ON public.accounts FOR DELETE USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: bank_statements Users can delete own bank statements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own bank statements" ON public.bank_statements FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: clients Users can delete own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: expenses Users can delete own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: invoice_items Users can delete own invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own invoice items" ON public.invoice_items FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


--
-- Name: invoices Users can delete own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: stock_movements Users can delete own movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own movements" ON public.stock_movements FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: products Users can delete own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own products" ON public.products FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can delete their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING ((auth.uid() = id));


--
-- Name: saft_exports Users can insert own SAF-T exports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own SAF-T exports" ON public.saft_exports FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: accounts Users can insert own accounts or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own accounts or as accountant" ON public.accounts FOR INSERT WITH CHECK (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: bank_statements Users can insert own bank statements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own bank statements" ON public.bank_statements FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: clients Users can insert own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: expenses Users can insert own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: invoice_items Users can insert own invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own invoice items" ON public.invoice_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


--
-- Name: invoices Users can insert own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: stock_movements Users can insert own movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own movements" ON public.stock_movements FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (auth.uid() = created_by)));


--
-- Name: products Users can insert own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own products" ON public.products FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_roles Users can insert own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: clients Users can only view their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can only view their own clients" ON public.clients FOR SELECT USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: accounts Users can update own accounts or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own accounts or as accountant" ON public.accounts FOR UPDATE USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: bank_statements Users can update own bank statements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own bank statements" ON public.bank_statements FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: clients Users can update own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: expenses Users can update own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: invoice_items Users can update own invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own invoice items" ON public.invoice_items FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


--
-- Name: invoices Users can update own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: stock_movements Users can update own movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own movements" ON public.stock_movements FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: products Users can update own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own products" ON public.products FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile or as accountant" ON public.profiles FOR UPDATE USING (((auth.uid() = id) OR (EXISTS ( SELECT 1
   FROM public.workspace_members
  WHERE ((workspace_members.workspace_owner_id = profiles.id) AND (workspace_members.member_user_id = auth.uid()) AND (workspace_members.role = 'accountant'::public.app_role)))))) WITH CHECK (((auth.uid() = id) OR (EXISTS ( SELECT 1
   FROM public.workspace_members
  WHERE ((workspace_members.workspace_owner_id = profiles.id) AND (workspace_members.member_user_id = auth.uid()) AND (workspace_members.role = 'accountant'::public.app_role))))));


--
-- Name: saft_exports Users can update their own exports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own exports" ON public.saft_exports FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: saft_exports Users can view own SAF-T exports or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own SAF-T exports or as accountant" ON public.saft_exports FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: accounts Users can view own accounts or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own accounts or as accountant" ON public.accounts FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: bank_statements Users can view own bank statements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own bank statements" ON public.bank_statements FOR SELECT USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: clients Users can view own clients or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own clients or as accountant" ON public.clients FOR SELECT USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: expenses Users can view own expenses or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own expenses or as accountant" ON public.expenses FOR SELECT USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: invoice_items Users can view own invoice items or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own invoice items or as accountant" ON public.invoice_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND ((invoices.user_id = auth.uid()) OR public.has_workspace_access(invoices.user_id, auth.uid()))))));


--
-- Name: invoices Users can view own invoices or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own invoices or as accountant" ON public.invoices FOR SELECT USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: stock_movements Users can view own movements or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own movements or as accountant" ON public.stock_movements FOR SELECT USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: products Users can view own products or as accountant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own products or as accountant" ON public.products FOR SELECT USING (((auth.uid() = user_id) OR public.has_workspace_access(user_id, auth.uid())));


--
-- Name: profiles Users can view own profile or authorized workspace profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile or authorized workspace profiles" ON public.profiles FOR SELECT USING (((auth.uid() = id) OR (EXISTS ( SELECT 1
   FROM public.workspace_members
  WHERE ((workspace_members.workspace_owner_id = profiles.id) AND (workspace_members.member_user_id = auth.uid()) AND (workspace_members.role = 'accountant'::public.app_role))))));


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_subscriptions Users can view own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: payment_transactions Users can view own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own transactions" ON public.payment_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_logs Users can view their own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: rate_limits Users can view their own rate limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own rate limits" ON public.rate_limits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_sessions Users can view their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sessions" ON public.user_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: workspace_members Users can view workspaces they own or are members of; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspaces they own or are members of" ON public.workspace_members FOR SELECT USING (((workspace_owner_id = auth.uid()) OR (member_user_id = auth.uid())));


--
-- Name: user_roles Users cannot change their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users cannot change their own role" ON public.user_roles FOR UPDATE USING (false);


--
-- Name: workspace_members Workspace owners can update member roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Workspace owners can update member roles" ON public.workspace_members FOR UPDATE USING ((auth.uid() = workspace_owner_id)) WITH CHECK ((auth.uid() = workspace_owner_id));


--
-- Name: access_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: bank_statements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: currency_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: invitation_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_gateway_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_gateway_config ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: saft_exports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saft_exports ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: webhook_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

--
-- Name: workspace_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


