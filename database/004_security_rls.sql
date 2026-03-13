-- ==========================================
-- 004: Global Security (RLS Policies)
-- ==========================================
-- This script centralizes all security policies.

-- 1. Employees Table Policies
DROP POLICY IF EXISTS "Enable select for own and privileged" ON public.employees;
CREATE POLICY "Enable select for own and privileged" ON public.employees
    FOR SELECT USING (auth.uid() = public.employees.id OR public.user_has_permission('view_all_employees'));

DROP POLICY IF EXISTS "Enable manage for admins" ON public.employees;
CREATE POLICY "Enable manage for admins" ON public.employees
    FOR ALL USING (public.user_has_permission('manage_employees'));

-- 2. FB Accounts Policies
DROP POLICY IF EXISTS "Users can see assigned FB accounts" ON public.fb_accounts;
DROP POLICY IF EXISTS "Managers can see all FB" ON public.fb_accounts;
DROP POLICY IF EXISTS "FB hierarchical visibility" ON public.fb_accounts;

CREATE POLICY "FB hierarchical visibility" ON public.fb_accounts
    FOR SELECT USING (
        -- 1. Admins/Super Admins see everything
        public.user_has_permission('manage_all_fb') OR 
        -- 2. Staff see assigned accounts
        public.fb_accounts.assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM public.employee_fb_access WHERE employee_id = auth.uid() AND fb_account_id = public.fb_accounts.id) OR
        -- 3. Managers see their team's accounts
        EXISTS (
            SELECT 1 FROM public.teams t 
            JOIN public.employees e ON e.id = auth.uid()
            WHERE t.manager_id = auth.uid() AND (public.fb_accounts.team_id = t.id OR public.fb_accounts.assigned_to = e.id)
        )
    );

-- 3. Tokens Table Policies
DROP POLICY IF EXISTS "Only admins manage tokens" ON public.tokens;
DROP POLICY IF EXISTS "Hierarchy can view tokens" ON public.tokens;
CREATE POLICY "Hierarchy can view tokens" ON public.tokens
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.fb_accounts WHERE public.fb_accounts.id = public.tokens.account_id::UUID)
    );

CREATE POLICY "Only admins manage tokens" ON public.tokens
    FOR ALL USING (public.user_has_permission('manage_fb_tokens'));

-- 4. Pages Table Policies
DROP POLICY IF EXISTS "Users can see pages of assigned accounts" ON public.pages;
DROP POLICY IF EXISTS "Pages hierarchical visibility" ON public.pages;
CREATE POLICY "Pages hierarchical visibility" ON public.pages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.fb_accounts WHERE public.fb_accounts.id = public.pages.account_id::UUID)
    );

-- 5. Daily Stats Policies
DROP POLICY IF EXISTS "Users can view relevant insights" ON public.daily_stats;
DROP POLICY IF EXISTS "Insights hierarchical visibility" ON public.daily_stats;
CREATE POLICY "Insights hierarchical visibility" ON public.daily_stats
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.pages WHERE public.pages.id = public.daily_stats.page_id::UUID)
    );

-- 6. Sync Logs Policies
DROP POLICY IF EXISTS "Users can view relevant sync logs" ON public.fb_sync_logs;
DROP POLICY IF EXISTS "Sync logs hierarchical visibility" ON public.fb_sync_logs;
CREATE POLICY "Sync logs hierarchical visibility" ON public.fb_sync_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.fb_accounts WHERE public.fb_accounts.id = public.fb_sync_logs.fb_account_id::UUID)
    );
