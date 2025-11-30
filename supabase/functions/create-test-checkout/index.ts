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

    const { priceId, email } = await req.json();

    if (!priceId || !email) {
      throw new Error('Price ID and email are required');
    }

    console.log('Creating test checkout session for:', email);

    // Create or retrieve customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      console.log('Using existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          test_subscription: 'true',
        },
      });
      console.log('Created new customer:', customer.id);
    }

    // Get the current domain
    const url = new URL(req.url);
    const origin = url.origin;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/admin/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/admin/dashboard?canceled=true`,
      metadata: {
        test_subscription: 'true',
        admin_user_id: user.id,
      },
    });

    console.log('Test checkout session created:', session.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: session.url,
        sessionId: session.id,
        customerId: customer.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error creating test checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
