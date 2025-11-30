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

    const { data: config } = await supabaseClient
      .from('payment_gateway_config')
      .select('api_key_encrypted')
      .eq('gateway_name', 'stripe')
      .single();

    if (!config?.api_key_encrypted) {
      return new Response(
        JSON.stringify({ success: false, error: 'Stripe API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const stripe = new Stripe(config.api_key_encrypted, {
      apiVersion: '2023-10-16',
    });

    console.log('Testing Stripe connection...');
    const account = await stripe.account.retrieve();
    
    console.log('Stripe connection successful:', account.id);

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          id: account.id,
          email: account.email,
          country: account.country,
          type: account.type,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error testing Stripe connection:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
