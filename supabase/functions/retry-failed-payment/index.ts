import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseClient
      .rpc('is_admin', { _user_id: user.id });

    if (!isAdmin) {
      throw new Error('Forbidden: Admin access required');
    }

    const { transactionId } = await req.json();

    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    // Get transaction details
    const { data: transaction, error: txError } = await supabaseClient
      .from('payment_transactions')
      .select('*, user_subscriptions!inner(stripe_subscription_id)')
      .eq('id', transactionId)
      .eq('status', 'failed')
      .single();

    if (txError || !transaction) {
      throw new Error('Transaction not found or not in failed status');
    }

    // Get Stripe configuration
    const { data: stripeConfig, error: configError } = await supabaseClient
      .from('payment_gateway_config')
      .select('api_key_encrypted')
      .eq('gateway_name', 'stripe')
      .single();

    if (configError || !stripeConfig?.api_key_encrypted) {
      throw new Error('Stripe configuration not found');
    }

    const stripe = (await import('https://esm.sh/stripe@13.0.0?target=deno')).default(
      stripeConfig.api_key_encrypted,
      { apiVersion: '2023-10-16' }
    );

    // Get subscription and retry payment
    const subscriptionId = transaction.user_subscriptions.stripe_subscription_id;
    
    if (!subscriptionId) {
      throw new Error('No subscription found for this transaction');
    }

    // Retrieve latest invoice for the subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const latestInvoiceId = subscription.latest_invoice as string;

    if (!latestInvoiceId) {
      throw new Error('No invoice found for subscription');
    }

    // Retry the payment
    const invoice = await stripe.invoices.retrieve(latestInvoiceId);
    
    if (invoice.status === 'open' || invoice.status === 'uncollectible') {
      // Attempt to pay the invoice
      const paidInvoice = await stripe.invoices.pay(latestInvoiceId);

      // Update transaction
      await supabaseClient
        .from('payment_transactions')
        .update({
          status: paidInvoice.status === 'paid' ? 'succeeded' : 'failed',
          last_retry_at: new Date().toISOString(),
          metadata: {
            ...transaction.metadata,
            retry_attempted: true,
            retry_at: new Date().toISOString(),
          },
        })
        .eq('id', transactionId);

      console.log('Payment retry completed:', paidInvoice.status);

      return new Response(
        JSON.stringify({ 
          success: paidInvoice.status === 'paid',
          status: paidInvoice.status,
          message: paidInvoice.status === 'paid' ? 'Payment successful' : 'Payment retry failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: `Invoice is in ${invoice.status} status and cannot be retried`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error retrying payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
