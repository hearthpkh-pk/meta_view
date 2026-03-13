-- ========================================================
-- 010: Indexing & Workspace Scoping Optimization
-- (Ensures scalability for 3,000+ records and personal scoping)
-- ========================================================

-- 1. Ensure 'assigned_to' exists on 'pages' table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='assigned_to') THEN
        ALTER TABLE public.pages ADD COLUMN assigned_to UUID REFERENCES public.employees(id);
    END IF;
END $$;

-- 2. Create Scalability Indexes (B-tree)
-- These prevent full table scans as the number of users and accounts grows to thousands.

-- Index for personal workspace filtering (Accounts)
CREATE INDEX IF NOT EXISTS idx_fb_accounts_assigned_to ON public.fb_accounts(assigned_to);

-- Index for personal workspace filtering (Pages)
CREATE INDEX IF NOT EXISTS idx_pages_assigned_to ON public.pages(assigned_to);

-- Index for Team/Manager oversight queries
CREATE INDEX IF NOT EXISTS idx_fb_accounts_team_id ON public.fb_accounts(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON public.teams(manager_id);

-- Index for sorting/ordering in SetupView
CREATE INDEX IF NOT EXISTS idx_pages_order_index ON public.pages(order_index);

-- 3. Update RLS for Pages to support direct assignment
-- This allows more granular control than just relying on the parent account.
DROP POLICY IF EXISTS "Pages hierarchical visibility" ON public.pages;
CREATE POLICY "Pages hierarchical visibility" ON public.pages
    FOR ALL USING (
        public.user_has_permission('manage_all_fb') OR 
        assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM public.fb_accounts WHERE id = public.pages.account_id AND assigned_to = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.teams t 
            JOIN public.fb_accounts acc ON acc.team_id = t.id
            WHERE t.manager_id = auth.uid() AND acc.id = public.pages.account_id
        )
    );
