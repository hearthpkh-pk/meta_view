-- ==========================================
-- 006: Facebook Insights & Sync Logs
-- ==========================================
-- This script supports analytics and tracking for FB data.

-- 1. Daily Stats (For Analytics Dashboard)
CREATE TABLE IF NOT EXISTS public.daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Metrics
    page_media_views INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(page_id, date)
);

-- 2. FB Sync Logs (Tracking API Syncs)
CREATE TABLE IF NOT EXISTS public.fb_sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fb_account_id UUID REFERENCES public.fb_accounts(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL, -- 'pages', 'insights', 'tokens'
    status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    
    triggered_by UUID REFERENCES public.employees(id) DEFAULT auth.uid(),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. Enable RLS
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_sync_logs ENABLE ROW LEVEL SECURITY;

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_page_id ON public.daily_stats(page_id);
