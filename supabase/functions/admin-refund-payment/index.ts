import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify admin access
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error('Admin access required');
    }

    const { data: config } = await supabaseClient
      .from('payment_gateway_config')
      .select('api_key_encrypted')
      .eq('gateway_name', 'stripe')
      .single();

    if (!config?.api_key_encrypted) {
      throw new Error('Stripe API key not configured');
    }

    const stripe = new Stripe(config.api_key_encrypted, {
      apiVersion: '2023-10-16',
    });

    const { paymentIntentId, amount, transactionId } = await req.json();

    if (!paymentIntentId) {
      throw new Error('Payment Intent ID is required');
    }

    console.log('Admin issuing refund for payment:', paymentIntentId);

    // Create refund (if amount is not provided, it will be a full refund)
    const refundData: any = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount);
    }

    const refund = await stripe.refunds.create(refundData);

    console.log('Refund created:', refund.id);

    // Update local transaction status
    if (transactionId) {
      const { error: updateError } = await supabaseClient
        .from('payment_transactions')
        .update({
          status: refund.status === 'succeeded' ? 'refunded' : 'refund_pending',
          updated_at: new Date().toISOString(),
          metadata: {
            refund_id: refund.id,
            refund_amount: refund.amount,
            refund_status: refund.status,
          },
        })
        .eq('id', transactionId);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing refund:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
