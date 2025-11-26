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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting scheduled SAF-T generation for all users...');

    // Get all users with profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, company_name, email');

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    console.log(`Found ${profiles?.length || 0} profiles to process`);

    // Calculate previous month period
    const today = new Date();
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const periodFrom = firstDayOfLastMonth.toISOString().split('T')[0];
    const periodTo = lastDayOfLastMonth.toISOString().split('T')[0];

    console.log(`Generating SAF-T for period: ${periodFrom} to ${periodTo}`);

    const results = {
      total: profiles?.length || 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each user
    for (const profile of profiles || []) {
      try {
        console.log(`Processing user: ${profile.company_name} (${profile.id})`);

        // Check if user has Chart of Accounts with required accounts
        const { data: accounts } = await supabaseAdmin
          .from('accounts')
          .select('account_code')
          .eq('user_id', profile.id);

        const accountCodes = (accounts || []).map(acc => acc.account_code);
        const requiredAccounts = ['4111', '707', '4427'];
        const missingAccounts = requiredAccounts.filter(code => !accountCodes.includes(code));

        if (missingAccounts.length > 0) {
          console.log(`Skipping user ${profile.company_name}: Missing required accounts (${missingAccounts.join(', ')})`);
          results.failed++;
          results.errors.push(`${profile.company_name}: Missing accounts ${missingAccounts.join(', ')}`);
          continue;
        }

        // Check if user has any invoices in the period
        const { data: invoices } = await supabaseAdmin
          .from('invoices')
          .select('id')
          .eq('user_id', profile.id)
          .gte('issue_date', periodFrom)
          .lte('issue_date', periodTo)
          .limit(1);

        if (!invoices || invoices.length === 0) {
          console.log(`Skipping user ${profile.company_name}: No invoices in period`);
          continue;
        }

        // Generate SAF-T by calling the generate-saft-xml function
        const { data, error } = await supabaseAdmin.functions.invoke('generate-saft-xml', {
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: { 
            periodFrom,
            periodTo,
            userId: profile.id, // Pass user ID for service role context
          },
        });

        if (error) {
          throw error;
        }

        if (data.success) {
          console.log(`Successfully generated SAF-T for ${profile.company_name}`);
          results.successful++;
        } else {
          throw new Error('Generation failed without error');
        }

      } catch (error) {
        console.error(`Error processing user ${profile.company_name}:`, error);
        results.failed++;
        results.errors.push(`${profile.company_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Scheduled SAF-T generation completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled SAF-T generation completed',
        period: { from: periodFrom, to: periodTo },
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in scheduled SAF-T generation:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
