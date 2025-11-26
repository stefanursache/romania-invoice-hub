-- Allow business users to view their own subscriptions
DROP POLICY IF EXISTS "Only admins can view all subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Allow business users to view their own transactions
DROP POLICY IF EXISTS "Only admins can view all transactions" ON public.payment_transactions;

CREATE POLICY "Users can view own transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (is_admin(auth.uid()));