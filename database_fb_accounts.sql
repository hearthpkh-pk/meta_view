-- ==========================================
-- 🚀 Phase 1.3: Facebook Accounts Database Schema
-- ==========================================
-- สร้างตารางสำหรับจัดการบัญชี Facebook และการมอบหมาย
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. Create FB Accounts Table (from fb-manager)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.fb_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Account Information
    uid TEXT NOT NULL UNIQUE,  -- Facebook User ID
    email TEXT,
    display_name TEXT,  -- ชื่อที่แสดง
    profile_url TEXT,  -- Link to Facebook profile
    
    -- Credentials (Encrypted)
    username TEXT,  -- Username/email สำหรับ login
    password TEXT,  -- Encrypted password
    password_hint TEXT,  -- คำใบ้รหัสผ่าน
    
    -- Email Access
    email_password TEXT,  -- Encrypted email password
    email_provider TEXT DEFAULT 'gmail',  -- gmail, outlook, etc.
    
    -- 2FA Information
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,  -- Encrypted 2FA secret
    two_factor_backup_codes TEXT,  -- Encrypted backup codes
    two_pin TEXT,  -- PIN for 2FA
    
    -- Account Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active', 'inactive', 'suspended', 'banned', 'deleted'
    )),
    
    -- Account Details
    account_type TEXT DEFAULT 'personal',  -- personal, business, creator
    verification_status TEXT DEFAULT 'none',  -- none, verified, blue_verified
    account_age_years INTEGER,  -- อายุบัญชีปี
    friend_count INTEGER DEFAULT 0,
    
    -- Security Notes
    security_notes TEXT,  -- บันทึกความปลอดภัย
    last_login_at TIMESTAMPTZ,
    last_password_change TIMESTAMPTZ,
    
    -- Assignment & Management
    assigned_to UUID REFERENCES public.employees(id),  -- พนักงานที่ดูแล
    managed_by UUID REFERENCES public.employees(id),  -- ผู้จัดการโดยตรง
    
    -- Metadata
    notes TEXT,  -- หมายเหตุทั่วไป
    tags TEXT[],  -- Tags สำหรับค้นหา
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),  -- 1=สูงสุด, 5=ต่ำสุด
    
    -- Audit & Tracking
    created_by UUID REFERENCES public.employees(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft Delete
    deleted_at TIMESTAMPTZ
);

-- ==========================================
-- 2. Create Account Pages Junction Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.account_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES public.fb_accounts(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL,  -- Facebook Page ID
    page_name TEXT NOT NULL,
    page_category TEXT DEFAULT 'uncategorized',
    page_access_level TEXT DEFAULT 'admin' CHECK (page_access_level IN (
        'admin', 'editor', 'moderator', 'analyst', 'advertiser'
    )),
    
    -- Page Details
    page_url TEXT,
    page_likes INTEGER DEFAULT 0,
    page_followers INTEGER DEFAULT 0,
    page_category_id UUID REFERENCES public.page_categories(id),
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active', 'inactive', 'unpublished', 'deleted'
    )),
    
    -- Management
    is_primary_page BOOLEAN DEFAULT false,  -- เพจหลักของบัญชีนี้
    auto_sync_enabled BOOLEAN DEFAULT true,  -- Sync ข้อมูลอัตโนมัติ
    last_sync_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(account_id, page_id)
);

-- ==========================================
-- 3. Create Employee FB Access Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.employee_fb_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.fb_accounts(id) ON DELETE CASCADE,
    
    -- Access Details
    access_level TEXT DEFAULT 'viewer' CHECK (access_level IN (
        'owner', 'admin', 'editor', 'moderator', 'viewer'
    )),
    
    -- Permissions
    can_view_insights BOOLEAN DEFAULT true,
    can_edit_content BOOLEAN DEFAULT false,
    can_manage_ads BOOLEAN DEFAULT false,
    can_view_performance BOOLEAN DEFAULT true,
    
    -- Assignment Details
    assigned_by UUID REFERENCES public.employees(id) DEFAULT auth.uid(),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- หมดอายุการมอบสิทธิ์
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active', 'suspended', 'revoked', 'expired'
    )),
    
    -- Notes
    assignment_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, account_id)
);

-- ==========================================
-- 4. Create FB Sync Logs Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.fb_sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES public.fb_accounts(id) ON DELETE CASCADE,
    page_id TEXT,  -- Optional: sync specific page
    
    -- Sync Details
    sync_type TEXT NOT NULL CHECK (sync_type IN (
        'account_info', 'pages_list', 'page_insights', 'page_posts', 'full_sync'
    )),
    
    -- Sync Results
    status TEXT DEFAULT 'running' CHECK (status IN (
        'running', 'completed', 'failed', 'cancelled'
    )),
    
    -- Results
    records_synced INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Error Information
    error_message TEXT,
    error_details JSONB,  -- Detailed error info
    
    -- Performance Metrics
    sync_duration_seconds INTEGER,
    api_calls_made INTEGER DEFAULT 0,
    
    -- Metadata
    triggered_by UUID REFERENCES public.employees(id) DEFAULT auth.uid(),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Sync Configuration
    sync_config JSONB,  -- Store sync parameters
    last_sync_token TEXT  -- For incremental sync
);

-- ==========================================
-- 5. Create Indexes for Performance
-- ==========================================

-- FB Accounts Indexes
CREATE INDEX IF NOT EXISTS idx_fb_accounts_uid ON public.fb_accounts(uid);
CREATE INDEX IF NOT EXISTS idx_fb_accounts_status ON public.fb_accounts(status);
CREATE INDEX IF NOT EXISTS idx_fb_accounts_assigned_to ON public.fb_accounts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_fb_accounts_managed_by ON public.fb_accounts(managed_by);
CREATE INDEX IF NOT EXISTS idx_fb_accounts_priority ON public.fb_accounts(priority);
CREATE INDEX IF NOT EXISTS idx_fb_accounts_deleted_at ON public.fb_accounts(deleted_at);

-- Account Pages Indexes
CREATE INDEX IF NOT EXISTS idx_account_pages_account_id ON public.account_pages(account_id);
CREATE INDEX IF NOT EXISTS idx_account_pages_page_id ON public.account_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_account_pages_status ON public.account_pages(status);
CREATE INDEX IF NOT EXISTS idx_account_pages_category_id ON public.account_pages(page_category_id);

-- Employee FB Access Indexes
CREATE INDEX IF NOT EXISTS idx_employee_fb_access_employee_id ON public.employee_fb_access(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_fb_access_account_id ON public.employee_fb_access(account_id);
CREATE INDEX IF NOT EXISTS idx_employee_fb_access_status ON public.employee_fb_access(status);
CREATE INDEX IF NOT EXISTS idx_employee_fb_access_expires_at ON public.employee_fb_access(expires_at);

-- FB Sync Logs Indexes
CREATE INDEX IF NOT EXISTS idx_fb_sync_logs_account_id ON public.fb_sync_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_fb_sync_logs_status ON public.fb_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_fb_sync_logs_sync_type ON public.fb_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_fb_sync_logs_triggered_at ON public.fb_sync_logs(triggered_at);

-- ==========================================
-- 6. Enable RLS (Row Level Security)
-- ==========================================
ALTER TABLE public.fb_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_fb_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_sync_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 7. Create RLS Policies for FB Tables
-- ==========================================

-- FB Accounts Policies
-- Users with manage_all_fb can view all accounts
CREATE POLICY "Admins can view all FB accounts" ON public.fb_accounts
    FOR SELECT USING (public.user_has_permission('manage_all_fb'));

-- Users can view accounts assigned to them
CREATE POLICY "Users can view assigned FB accounts" ON public.fb_accounts
    FOR SELECT USING (
        auth.uid() = assigned_to OR
        auth.uid() = managed_by OR
        EXISTS (
            SELECT 1 FROM public.employee_fb_access efa
            WHERE efa.account_id = fb_accounts.id
            AND efa.employee_id = auth.uid()
            AND efa.status = 'active'
        )
    );

-- Only users with manage_all_fb can manage accounts
CREATE POLICY "Admins can manage FB accounts" ON public.fb_accounts
    FOR ALL USING (public.user_has_permission('manage_all_fb'));

-- Account Pages Policies
-- Users with manage_all_fb can view all pages
CREATE POLICY "Admins can view all account pages" ON public.account_pages
    FOR SELECT USING (public.user_has_permission('manage_all_fb'));

-- Users can view pages from accounts they have access to
CREATE POLICY "Users can view accessible account pages" ON public.account_pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.fb_accounts fa
            WHERE fa.id = account_pages.account_id
            AND (
                auth.uid() = fa.assigned_to OR
                auth.uid() = fa.managed_by OR
                EXISTS (
                    SELECT 1 FROM public.employee_fb_access efa
                    WHERE efa.account_id = fa.id
                    AND efa.employee_id = auth.uid()
                    AND efa.status = 'active'
                )
            )
        )
    );

-- Only users with manage_all_fb can manage pages
CREATE POLICY "Admins can manage account pages" ON public.account_pages
    FOR ALL USING (public.user_has_permission('manage_all_fb'));

-- Employee FB Access Policies
-- Users can view their own FB access
CREATE POLICY "Users can view own FB access" ON public.employee_fb_access
    FOR SELECT USING (auth.uid() = employee_id);

-- Users with manage_all_fb can view all FB access
CREATE POLICY "Admins can view all FB access" ON public.employee_fb_access
    FOR SELECT USING (public.user_has_permission('manage_all_fb'));

-- Users with manage_all_fb can manage FB access assignments
CREATE POLICY "Admins can manage FB access" ON public.employee_fb_access
    FOR ALL USING (public.user_has_permission('manage_all_fb'));

-- FB Sync Logs Policies
-- Users can view sync logs for accounts they manage
CREATE POLICY "Users can view relevant FB sync logs" ON public.fb_sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.fb_accounts fa
            WHERE fa.id = fb_sync_logs.account_id
            AND (
                auth.uid() = fa.assigned_to OR
                auth.uid() = fa.managed_by OR
                public.user_has_permission('manage_all_fb') OR
                EXISTS (
                    SELECT 1 FROM public.employee_fb_access efa
                    WHERE efa.account_id = fa.id
                    AND efa.employee_id = auth.uid()
                    AND efa.status = 'active'
                )
            )
        )
    );

-- ==========================================
-- 8. Create Helper Functions for FB Management
-- ==========================================

-- Function to get FB accounts accessible to user
CREATE OR REPLACE FUNCTION public.get_user_accessible_fb_accounts()
RETURNS TABLE(
    id UUID,
    uid TEXT,
    display_name TEXT,
    status TEXT,
    access_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fa.id,
        fa.uid,
        fa.display_name,
        fa.status,
        CASE 
            WHEN public.user_has_permission('manage_all_fb') THEN 'admin'
            WHEN auth.uid() = fa.assigned_to OR auth.uid() = fa.managed_by THEN 'manager'
            ELSE COALESCE(efa.access_level, 'viewer')
        END as access_level
    FROM public.fb_accounts fa
    LEFT JOIN public.employee_fb_access efa ON efa.account_id = fa.id AND efa.employee_id = auth.uid()
    WHERE 
        fa.deleted_at IS NULL
        AND (
            public.user_has_permission('manage_all_fb') OR
            auth.uid() = fa.assigned_to OR
            auth.uid() = fa.managed_by OR
            efa.employee_id = auth.uid()
        );
END;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get pages accessible to user
CREATE OR REPLACE FUNCTION public.get_user_accessible_pages()
RETURNS TABLE(
    page_id TEXT,
    page_name TEXT,
    account_display_name TEXT,
    access_level TEXT,
    can_view_insights BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.page_id,
        ap.page_name,
        fa.display_name as account_display_name,
        CASE 
            WHEN public.user_has_permission('manage_all_fb') THEN 'admin'
            WHEN auth.uid() = fa.assigned_to OR auth.uid() = fa.managed_by THEN 'manager'
            ELSE COALESCE(efa.access_level, 'viewer')
        END as access_level,
        CASE 
            WHEN public.user_has_permission('manage_all_fb') OR
                 auth.uid() = fa.assigned_to OR 
                 auth.uid() = fa.managed_by OR
                 efa.can_view_insights = true THEN true
            ELSE false
        END as can_view_insights
    FROM public.account_pages ap
    INNER JOIN public.fb_accounts fa ON ap.account_id = fa.id
    LEFT JOIN public.employee_fb_access efa ON efa.account_id = fa.id AND efa.employee_id = auth.uid()
    WHERE 
        fa.deleted_at IS NULL
        AND ap.status = 'active'
        AND (
            public.user_has_permission('manage_all_fb') OR
            auth.uid() = fa.assigned_to OR
            auth.uid() = fa.managed_by OR
            efa.employee_id = auth.uid()
        );
END;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user can access specific FB account
CREATE OR REPLACE FUNCTION public.user_can_access_fb_account(
    p_account_id UUID,
    p_permission TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN := false;
BEGIN
    -- Check if user has global permission
    IF p_permission = 'manage' AND public.user_has_permission('manage_all_fb') THEN
        RETURN true;
    ELSIF p_permission = 'view' AND public.user_has_permission('view_team_fb') THEN
        RETURN true;
    END IF;
    
    -- Check direct assignment
    SELECT EXISTS (
        SELECT 1 FROM public.fb_accounts fa
        WHERE fa.id = p_account_id
        AND fa.deleted_at IS NULL
        AND (
            (p_permission = 'manage' AND (auth.uid() = fa.assigned_to OR auth.uid() = fa.managed_by)) OR
            (p_permission = 'view' AND (
                auth.uid() = fa.assigned_to OR 
                auth.uid() = fa.managed_by OR
                EXISTS (
                    SELECT 1 FROM public.employee_fb_access efa
                    WHERE efa.account_id = p_account_id
                    AND efa.employee_id = auth.uid()
                    AND efa.status = 'active'
                )
            ))
        )
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- 9. Create Triggers for Updated Timestamps
-- ==========================================

-- FB Accounts trigger
CREATE OR REPLACE FUNCTION update_fb_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fb_accounts_updated_at ON public.fb_accounts;
CREATE TRIGGER fb_accounts_updated_at
    BEFORE UPDATE ON public.fb_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_fb_accounts_updated_at();

-- Account Pages trigger
CREATE OR REPLACE FUNCTION update_account_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS account_pages_updated_at ON public.account_pages;
CREATE TRIGGER account_pages_updated_at
    BEFORE UPDATE ON public.account_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_account_pages_updated_at();

-- Employee FB Access trigger
CREATE OR REPLACE FUNCTION update_employee_fb_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employee_fb_access_updated_at ON public.employee_fb_access;
CREATE TRIGGER employee_fb_access_updated_at
    BEFORE UPDATE ON public.employee_fb_access
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_fb_access_updated_at();

-- ==========================================
-- 10. Create Views for Common Queries
-- ==========================================

-- View: FB Accounts with Assignment Info
CREATE OR REPLACE VIEW public.fb_accounts_with_assignment AS
SELECT 
    fa.*,
    assigned_employee.first_name || ' ' || assigned_employee.last_name as assigned_to_name,
    manager_employee.first_name || ' ' || manager_employee.last_name as managed_by_name,
    COUNT(ap.id) as page_count,
    COUNT(efa.id) as employee_access_count
FROM public.fb_accounts fa
LEFT JOIN public.employees assigned_employee ON fa.assigned_to = assigned_employee.id
LEFT JOIN public.employees manager_employee ON fa.managed_by = manager_employee.id
LEFT JOIN public.account_pages ap ON fa.id = ap.account_id AND ap.status = 'active'
LEFT JOIN public.employee_fb_access efa ON fa.id = efa.account_id AND efa.status = 'active'
WHERE fa.deleted_at IS NULL
GROUP BY fa.id, assigned_employee.first_name, assigned_employee.last_name, 
         manager_employee.first_name, manager_employee.last_name;

-- View: Employee FB Access Summary
CREATE OR REPLACE VIEW public.employee_fb_access_summary AS
SELECT 
    efa.*,
    employee.first_name || ' ' || employee.last_name as employee_name,
    fa.display_name as account_name,
    fa.uid as account_uid,
    COUNT(ap.id) as accessible_pages
FROM public.employee_fb_access efa
INNER JOIN public.employees employee ON efa.employee_id = employee.id
INNER JOIN public.fb_accounts fa ON efa.account_id = fa.id
LEFT JOIN public.account_pages ap ON fa.id = ap.account_id AND ap.status = 'active'
WHERE efa.status = 'active'
GROUP BY efa.id, employee.first_name, employee.last_name, fa.display_name, fa.uid;

-- ==========================================
-- 11. Sample Queries for Testing
-- ==========================================

-- Test: Get accessible FB accounts for current user
/*
SELECT * FROM public.get_user_accessible_fb_accounts();
*/

-- Test: Get accessible pages for current user
/*
SELECT * FROM public.get_user_accessible_pages();
*/

-- Test: Check account access
/*
SELECT public.user_can_access_fb_account('account-uuid', 'manage');
*/

-- Test: Get FB accounts with assignment info
/*
SELECT * FROM public.fb_accounts_with_assignment
WHERE status = 'active'
ORDER BY priority, created_at;
*/

-- ==========================================
-- ✅ Phase 1.3 Complete: FB Accounts Schema
-- ==========================================
