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
      throw new Error('Stripe API key not configured');
    }

    const stripe = new Stripe(config.api_key_encrypted, {
      apiVersion: '2023-10-16',
    });

    console.log('Fetching Stripe products...');

    const products = await stripe.products.list({
      limit: 100,
      expand: ['data.default_price'],
    });

    // Fetch all prices for each product
    const productsWithPrices = await Promise.all(
      products.data.map(async (product: any) => {
        const prices = await stripe.prices.list({
          product: product.id,
          limit: 100,
        });
        return {
          ...product,
          prices: prices.data,
        };
      })
    );

    console.log(`Fetched ${productsWithPrices.length} products`);

    return new Response(
      JSON.stringify({ success: true, products: productsWithPrices }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error listing products:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
