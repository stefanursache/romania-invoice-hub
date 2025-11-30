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
    console.log('=== SETUP STRIPE PRODUCTS START ===');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { 
            Authorization: req.headers.get('Authorization')!,
            apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          },
        },
      }
    );

    // Verify user is admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    console.log('Admin verified');

    // Get Stripe API key
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

    console.log('Stripe initialized');

    // Define products based on pricing page
    const productsToCreate = [
      {
        name: 'Starter',
        description: 'Perfect pentru mici afaceri și PFA-uri',
        monthlyPrice: 4900, // 49 RON in cents
        annualPrice: 49000, // 490 RON in cents (10 months price)
      },
      {
        name: 'Professional',
        description: 'Pentru afaceri în creștere cu echipe mari',
        monthlyPrice: 9900, // 99 RON in cents
        annualPrice: 99000, // 990 RON in cents (10 months price)
        metadata: { recommended: 'true' },
      },
    ];

    const results = [];

    for (const productData of productsToCreate) {
      console.log(`Creating product: ${productData.name}`);

      // Create product
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata || {},
      });

      console.log(`Product created: ${product.id}`);

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.monthlyPrice,
        currency: 'ron',
        recurring: {
          interval: 'month',
        },
      });

      console.log(`Monthly price created: ${monthlyPrice.id}`);

      // Create annual price
      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.annualPrice,
        currency: 'ron',
        recurring: {
          interval: 'year',
        },
      });

      console.log(`Annual price created: ${annualPrice.id}`);

      results.push({
        product: {
          id: product.id,
          name: product.name,
        },
        prices: {
          monthly: {
            id: monthlyPrice.id,
            amount: monthlyPrice.unit_amount,
          },
          annual: {
            id: annualPrice.id,
            amount: annualPrice.unit_amount,
          },
        },
      });
    }

    console.log('=== SETUP COMPLETE ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Stripe products and prices created successfully',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error setting up Stripe products:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
