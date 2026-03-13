-- ==========================================
-- 004: Global Security (RLS Policies)
-- ==========================================
-- This script centralizes all security policies.

-- 1. Employees Table Policies
DROP POLICY IF EXISTS "Enable select for own and privileged" ON public.employees;
CREATE POLICY "Enable select for own and privileged" ON public.employees
    FOR SELECT USING (auth.uid() = id OR public.user_has_permission('view_all_employees'));

DROP POLICY IF EXISTS "Enable manage for admins" ON public.employees;
CREATE POLICY "Enable manage for admins" ON public.employees
    FOR ALL USING (public.user_has_permission('manage_employees'));

-- 2. FB Accounts Policies
DROP POLICY IF EXISTS "Users can see assigned FB accounts" ON public.fb_accounts;
CREATE POLICY "Users can see assigned FB accounts" ON public.fb_accounts
    FOR SELECT USING (
        public.user_has_permission('manage_all_fb') OR 
        EXISTS (SELECT 1 FROM public.employee_fb_access WHERE employee_id = auth.uid() AND fb_account_id = public.fb_accounts.id)
    );

DROP POLICY IF EXISTS "Managers can see all FB" ON public.fb_accounts;
CREATE POLICY "Managers can see all FB" ON public.fb_accounts
    FOR SELECT USING (public.user_has_permission('manage_all_fb'));

-- 3. Tokens Table Policies
DROP POLICY IF EXISTS "Only admins manage tokens" ON public.tokens;
CREATE POLICY "Only admins manage tokens" ON public.tokens
    FOR ALL USING (public.user_has_permission('manage_fb_tokens'));

-- 4. Pages Table Policies
DROP POLICY IF EXISTS "Users can see pages of assigned accounts" ON public.pages;
CREATE POLICY "Users can see pages of assigned accounts" ON public.pages
    FOR SELECT USING (
        public.user_has_permission('manage_all_fb') OR
        EXISTS (SELECT 1 FROM public.employee_fb_access WHERE employee_id = auth.uid() AND fb_account_id = public.pages.account_id)
    );

-- 5. Daily Stats Policies
DROP POLICY IF EXISTS "Users can view relevant insights" ON public.daily_stats;
CREATE POLICY "Users can view relevant insights" ON public.daily_stats
    FOR SELECT USING (
        public.user_has_permission('view_fb_insights') OR
        public.user_has_permission('manage_all_fb')
    );

-- 6. Sync Logs Policies
DROP POLICY IF EXISTS "Users can view relevant sync logs" ON public.fb_sync_logs;
CREATE POLICY "Users can view relevant sync logs" ON public.fb_sync_logs
    FOR SELECT USING (
        public.user_has_permission('manage_all_fb') OR
        EXISTS (SELECT 1 FROM public.employee_fb_access WHERE employee_id = auth.uid() AND fb_account_id = public.fb_sync_logs.fb_account_id)
    );
