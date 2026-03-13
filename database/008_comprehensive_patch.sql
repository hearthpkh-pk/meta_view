-- ========================================================
-- 008: Comprehensive System Patch
-- (Fixes persistence issues & Resolves team_id error)
-- ========================================================

-- 1. Create Teams Table (If not already created by 007)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add team_id to employees & fb_accounts (Safe check)
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='team_id') THEN
        ALTER TABLE public.employees ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='team_id') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Add Missing Workspace Persistence Columns (Crucial for Data Saving)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='passmail') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN passmail TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='url') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='show_password') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN show_password BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='pages_managed') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN pages_managed UUID[] DEFAULT '{}';
    END IF;
    
    -- Patch Pages table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='url') THEN
        ALTER TABLE public.pages ADD COLUMN url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='comment') THEN
        ALTER TABLE public.pages ADD COLUMN comment TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='order_index') THEN
        ALTER TABLE public.pages ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='page_type') THEN
        ALTER TABLE public.pages ADD COLUMN page_type TEXT DEFAULT 'Profile Page';
    END IF;
END $$;

-- 4. Re-apply RLS Policies with correct column references
DROP POLICY IF EXISTS "FB hierarchical visibility" ON public.fb_accounts;
CREATE POLICY "FB hierarchical visibility" ON public.fb_accounts
    FOR ALL USING (
        public.user_has_permission('manage_all_fb') OR 
        assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM public.employee_fb_access WHERE employee_id = auth.uid() AND fb_account_id = public.fb_accounts.id) OR
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.manager_id = auth.uid() AND (public.fb_accounts.team_id = t.id)
        )
    );

DROP POLICY IF EXISTS "Pages hierarchical visibility" ON public.pages;
CREATE POLICY "Pages hierarchical visibility" ON public.pages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.fb_accounts WHERE id = public.pages.account_id)
    );
