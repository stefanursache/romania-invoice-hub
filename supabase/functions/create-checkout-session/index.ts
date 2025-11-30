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
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { 
            Authorization: authHeader,
            apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          },
        },
      }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      console.error('No user found');
      throw new Error('User not authenticated');
    }

    console.log('User authenticated:', user.id);

    const { planName, billingPeriod } = await req.json();

    // Get Stripe configuration from database
    const { data: stripeConfig, error: configError } = await supabaseClient
      .from('payment_gateway_config')
      .select('api_key_encrypted, is_active')
      .eq('gateway_name', 'stripe')
      .single();

    if (configError || !stripeConfig?.api_key_encrypted) {
      throw new Error('Stripe is not configured. Please contact administrator.');
    }

    if (!stripeConfig.is_active) {
      throw new Error('Payment gateway is currently disabled.');
    }

    // Initialize Stripe with the API key from database
    const stripe = (await import('https://esm.sh/stripe@13.0.0?target=deno')).default(
      stripeConfig.api_key_encrypted,
      { apiVersion: '2023-10-16' }
    );

    // Get user profile for email
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email, company_name')
      .eq('id', user.id)
      .single();

    // Define plan prices (in cents)
    const prices: Record<string, { monthly: number; annual: number }> = {
      'Starter': { monthly: 4900, annual: 49000 },
      'Professional': { monthly: 9900, annual: 99000 },
      'Enterprise': { monthly: 19900, annual: 199000 },
    };

    const planPrice = prices[planName];
    if (!planPrice) {
      throw new Error('Invalid plan selected');
    }

    const amount = billingPeriod === 'annual' ? planPrice.annual : planPrice.monthly;
    const interval = billingPeriod === 'annual' ? 'year' : 'month';

    // Create or get customer
    let customerId: string;
    const { data: existingSubscription } = await supabaseClient
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        metadata: {
          user_id: user.id,
          company_name: profile?.company_name || '',
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'ron',
            product_data: {
              name: `${planName} Plan`,
              description: `${billingPeriod === 'annual' ? 'Annual' : 'Monthly'} subscription`,
            },
            unit_amount: amount,
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/settings?success=true`,
      cancel_url: `${req.headers.get('origin')}/settings?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_name: planName,
        billing_period: billingPeriod,
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
