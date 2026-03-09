// @ts-ignore : Deno specific import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore : Deno specific import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Authentication: Ensure user is logged into our system
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const supabaseAdmin = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) throw new Error('Unauthorized')

        // 3. Parse Request Payload
        const { shortLivedToken, fbUserId, appName } = await req.json()
        if (!shortLivedToken) throw new Error('Missing shortLivedToken')

        // We need FB App ID and Secret from environment variables to do the exchange.
        // @ts-ignore
        const FB_APP_ID = Deno.env.get('FB_APP_ID') || ''
        // @ts-ignore
        const FB_APP_SECRET = Deno.env.get('FB_APP_SECRET') || ''
        const META_API_VERSION = 'v25.0' // Aligning with metaApi.js

        if (!FB_APP_ID || !FB_APP_SECRET) {
            console.warn('FB_APP_ID or FB_APP_SECRET environment variables are missing contextually. Proceeding with short-lived token directly for testing/fallback.')
            // Fallback: If no secrets are set, we just save the short-lived one for immediate testing
            // But log a heavy warning because this token will die in 1-2 hours.
        }

        let longLivedToken = shortLivedToken;

        // 4. Exchange for Long-Lived Token (If Secrets exist)
        if (FB_APP_ID && FB_APP_SECRET) {
            const exchangeUrl = `https://graph.facebook.com/${META_API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
            const exRes = await fetch(exchangeUrl);
            const exData = await exRes.json();

            if (exData.error) {
                console.error("Token Exchange Error:", exData.error);
                throw new Error(`Failed to exchange token: ${exData.error.message}`);
            }
            longLivedToken = exData.access_token;
            console.log("Successfully exchanged for Long-Lived User Token.");
        }

        // 5. Save the Token into the `tokens` table
        // We link `added_by` to the current user (if the column exists).
        // For backwards compatibility with the current schema, we ensure name is descriptive.

        const tokenDisplay = appName || `FB Connected by ${user.email} (${new Date().toLocaleDateString()})`;

        const { data: insertedToken, error: insertError } = await supabaseAdmin
            .from('tokens')
            .insert({
                name: tokenDisplay,
                access_token: longLivedToken,
                status: 'active',
                // Temporarily commented out added_by in case schema hasn't updated yet. 
                // Will update schema in next step.
                added_by: user.id
            })
            .select()
            .single();

        if (insertError) {
            // If error is about added_by not existing, we retry without it for safety
            if (insertError.code === '42703') { // undefined_column
                const { data: retryToken, error: retryError } = await supabaseAdmin
                    .from('tokens')
                    .insert({
                        name: tokenDisplay,
                        access_token: longLivedToken,
                        status: 'active'
                    })
                    .select()
                    .single();

                if (retryError) throw new Error(`DB Insert Error: ${retryError.message}`);
                return new Response(JSON.stringify({ success: true, token: retryToken, warning: 'added_by column missing in DB' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
            throw new Error(`DB Insert Error: ${insertError.message}`);
        }

        // 6. Return Success
        return new Response(
            JSON.stringify({ success: true, token: insertedToken }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'Unknown internal error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
