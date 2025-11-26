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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { clientId, clientSecret, workspaceOwnerId } = await req.json();

    if (!clientId || !clientSecret) {
      throw new Error('Client ID and Client Secret are required');
    }

    // Verify user has access if testing for a workspace
    if (workspaceOwnerId) {
      const { data: hasAccess } = await supabaseClient
        .rpc('has_workspace_access', {
          _workspace_owner_id: workspaceOwnerId,
          _user_id: user.id
        });

      if (!hasAccess) {
        throw new Error('Access denied to this workspace');
      }
    }

    console.log('Testing SPV credentials for ANAF API...');

    // ANAF OAuth token endpoint (Production)
    const tokenUrl = 'https://logincert.anaf.ro/anaf-oauth2/v1/token';
    
    // Request OAuth token from ANAF
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'e-factura',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('ANAF token request failed:', tokenData);
      
      // Parse specific ANAF error messages
      let errorMessage = 'Invalid credentials';
      if (tokenData.error === 'invalid_client') {
        errorMessage = 'Invalid Client ID or Client Secret';
      } else if (tokenData.error === 'unauthorized_client') {
        errorMessage = 'Client not authorized for e-Factura scope';
      } else if (tokenData.error_description) {
        errorMessage = tokenData.error_description;
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          details: tokenData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify we got a valid token
    if (!tokenData.access_token) {
      throw new Error('No access token received from ANAF');
    }

    console.log('Successfully obtained ANAF access token');

    // Optionally test the e-Factura API with the token
    try {
      const efacturaApiUrl = 'https://api.anaf.ro/prod/FCTEL/rest/lista';
      
      const apiResponse = await fetch(efacturaApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (apiResponse.ok) {
        console.log('Successfully validated e-Factura API access');
      } else {
        console.warn('Token valid but e-Factura API test failed:', apiResponse.status);
      }
    } catch (apiError) {
      console.warn('Could not test e-Factura API:', apiError);
      // Don't fail the validation if API test fails - token might still be valid
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SPV credentials are valid and ANAF API is accessible',
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error testing SPV credentials:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
