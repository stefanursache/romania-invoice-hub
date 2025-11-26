-- Create products table for inventory management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'buc',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  minimum_stock NUMERIC DEFAULT 0,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  vat_rate INTEGER NOT NULL DEFAULT 19,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sku)
);

-- Create stock_movements table for tracking inventory changes
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Users can view own products or as accountant"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id OR has_workspace_access(user_id, auth.uid()));

CREATE POLICY "Users can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access"
  ON public.products FOR ALL
  USING (false);

-- RLS Policies for stock_movements
CREATE POLICY "Users can view own movements or as accountant"
  ON public.stock_movements FOR SELECT
  USING (auth.uid() = user_id OR has_workspace_access(user_id, auth.uid()));

CREATE POLICY "Users can insert own movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by);

CREATE POLICY "Users can update own movements"
  ON public.stock_movements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own movements"
  ON public.stock_movements FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access"
  ON public.stock_movements FOR ALL
  USING (false);

-- Indexes for performance
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_sku ON public.products(user_id, sku);
CREATE INDEX idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to update product stock after movement
CREATE OR REPLACE FUNCTION public.update_product_stock_after_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Trigger to auto-update stock
CREATE TRIGGER trigger_update_product_stock
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock_after_movement();