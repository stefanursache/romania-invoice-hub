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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Stripe configuration
    const { data: stripeConfig, error: configError } = await supabaseAdmin
      .from('payment_gateway_config')
      .select('api_key_encrypted, webhook_secret')
      .eq('gateway_name', 'stripe')
      .single();

    if (configError || !stripeConfig) {
      throw new Error('Stripe configuration not found');
    }

    const stripe = (await import('https://esm.sh/stripe@13.0.0?target=deno')).default(
      stripeConfig.api_key_encrypted,
      { apiVersion: '2023-10-16' }
    );

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature provided');
    }

    const body = await req.text();
    
    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeConfig.webhook_secret || ''
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errorMessage);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Webhook event type:', event.type);

    // Log webhook event to database
    const { error: logError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        event_data: event.data.object,
        status: 'processed',
      });

    if (logError) {
      console.error('Error logging webhook event:', logError);
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const planName = session.metadata?.plan_name;

        if (!userId || !planName) {
          console.error('Missing metadata in session');
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        // Update or create user subscription
        const { error: subError } = await supabaseAdmin
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan_name: planName,
            status: 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: false,
          });

        if (subError) {
          console.error('Error updating subscription:', subError);
        }

        // Update profile payment plan
        await supabaseAdmin
          .from('profiles')
          .update({ payment_plan: planName })
          .eq('id', userId);

        // Create transaction record
        await supabaseAdmin
          .from('payment_transactions')
          .insert({
            user_id: userId,
            amount: session.amount_total! / 100,
            currency: session.currency || 'ron',
            status: 'succeeded',
            stripe_payment_id: session.payment_intent as string,
            description: `Subscription: ${planName}`,
            metadata: { session_id: session.id },
          });

        console.log('Checkout session completed for user:', userId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        // Record successful payment
        const { data: subscription } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id, plan_name')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (subscription) {
          await supabaseAdmin
            .from('payment_transactions')
            .insert({
              user_id: subscription.user_id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'succeeded',
              stripe_payment_id: invoice.payment_intent as string,
              description: `Payment for ${subscription.plan_name}`,
              metadata: { invoice_id: invoice.id },
            });
        }

        console.log('Payment succeeded for subscription:', subscriptionId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        const { data: subscription } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id, plan_name')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (subscription) {
          // Update subscription status
          await supabaseAdmin
            .from('user_subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);

          // Record failed payment
          await supabaseAdmin
            .from('payment_transactions')
            .insert({
              user_id: subscription.user_id,
              amount: invoice.amount_due / 100,
              currency: invoice.currency,
              status: 'failed',
              description: `Failed payment for ${subscription.plan_name}`,
              metadata: { invoice_id: invoice.id },
            });
        }

        console.log('Payment failed for subscription:', subscriptionId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        await supabaseAdmin
          .from('user_subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Subscription canceled:', subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Subscription updated:', subscription.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
