import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const META_API_VERSION = process.env.META_API_VERSION || 'v21.0';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
    try {
        // 1. Fetch all active tokens
        const { data: tokens, error: tokenError } = await supabaseAdmin
            .from('tokens')
            .select('*, fb_accounts(name)')
            .eq('status', 'active');

        if (tokenError) throw tokenError;
        if (!tokens || tokens.length === 0) {
            return NextResponse.json({ success: false, error: 'No active tokens found' }, { status: 404 });
        }

        let totalFetched = 0;
        let successfulTokens = 0;
        let failedTokens: any[] = [];
        let allPages: any[] = [];

        // 2. Iterate and fetch from Meta API
        for (const token of tokens) {
            try {
                const response = await fetch(
                    `https://graph.facebook.com/${META_API_VERSION}/me/accounts?limit=100&fields=id,name,category,access_token,tasks&access_token=${token.token_value}`
                );

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error.message);
                }

                const pages = data.data || [];
                pages.forEach((page: any) => {
                    allPages.push({
                        fb_page_id: page.id,
                        name: page.name,
                        page_type: page.category || 'Classic Page',
                        account_id: token.account_id,
                        status: 'ใช้งานปกติ',
                        last_sync_at: new Date().toISOString()
                    });
                });

                totalFetched += pages.length;
                successfulTokens++;
            } catch (err: any) {
                console.error(`Error with token ${token.id}:`, err.message);
                failedTokens.push({ id: token.id, error: err.message });
            }
        }

        // 3. Upsert into Supabase
        if (allPages.length > 0) {
            const { error: upsertError } = await supabaseAdmin
                .from('pages')
                .upsert(allPages, { onConflict: 'fb_page_id' });

            if (upsertError) throw upsertError;
        }

        return NextResponse.json({
            success: true,
            count: totalFetched,
            successfulTokens,
            failedTokens,
            totalTokens: tokens.length
        });

    } catch (error: any) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
