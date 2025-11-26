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
    'accountant'
);


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
  INSERT INTO public.profiles (id, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company')
  );
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
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text])))
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
    postal_code text
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
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['business'::text, 'accountant'::text])))
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
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


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
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: saft_exports saft_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saft_exports
    ADD CONSTRAINT saft_exports_pkey PRIMARY KEY (id);


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
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date DESC);


--
-- Name: idx_expenses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_user_id ON public.expenses USING btree (user_id);


--
-- Name: accounts update_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


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
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


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
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


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
-- Name: workspace_members Only owners can invite members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only owners can invite members" ON public.workspace_members FOR INSERT WITH CHECK ((workspace_owner_id = auth.uid()));


--
-- Name: workspace_members Only owners can remove members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only owners can remove members" ON public.workspace_members FOR DELETE USING ((workspace_owner_id = auth.uid()));


--
-- Name: saft_exports Users can delete own SAF-T exports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own SAF-T exports" ON public.saft_exports FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: accounts Users can delete own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING ((auth.uid() = user_id));


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
-- Name: saft_exports Users can insert own SAF-T exports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own SAF-T exports" ON public.saft_exports FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: accounts Users can insert own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK ((auth.uid() = user_id));


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
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_roles Users can insert own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: accounts Users can update own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING ((auth.uid() = user_id));


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
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: saft_exports Users can view own SAF-T exports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own SAF-T exports" ON public.saft_exports FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: accounts Users can view own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING ((auth.uid() = user_id));


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
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: workspace_members Users can view workspaces they own or are members of; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view workspaces they own or are members of" ON public.workspace_members FOR SELECT USING (((workspace_owner_id = auth.uid()) OR (member_user_id = auth.uid())));


--
-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: saft_exports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saft_exports ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: workspace_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


