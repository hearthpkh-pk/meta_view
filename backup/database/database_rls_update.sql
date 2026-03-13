-- ==========================================
-- 🚀 Phase 1.4: Update RLS Policies for Dynamic RBAC
-- ==========================================
-- อัปเดต RLS policies ที่มีอยู่แล้วให้ใช้ Dynamic RBAC
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. Update Employees Table RLS Policies
-- ==========================================

-- Drop old policies
DROP POLICY IF EXISTS "Employees can view own profile" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Super Admins can manage employees" ON public.employees;

-- Create new policies using dynamic permissions

-- Policy 1: Employees can view own profile
CREATE POLICY "Employees can view own profile" ON public.employees
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy 2: Users with manage_employees permission can view all employees
CREATE POLICY "Users with manage_employees can view all employees" ON public.employees
    FOR SELECT 
    USING (public.user_has_permission('manage_employees'));

-- Policy 3: Users with view_all_employees permission can view all employees
CREATE POLICY "Users with view_all_employees can view all employees" ON public.employees
    FOR SELECT 
    USING (public.user_has_permission('view_all_employees'));

-- Policy 4: Only users with manage_employees can insert employees
CREATE POLICY "Users with manage_employees can insert employees" ON public.employees
    FOR INSERT 
    WITH CHECK (public.user_has_permission('manage_employees'));

-- Policy 5: Only users with manage_employees can update employees
CREATE POLICY "Users with manage_employees can update employees" ON public.employees
    FOR UPDATE 
    USING (public.user_has_permission('manage_employees'));

-- Policy 6: Only users with manage_employees can delete employees
CREATE POLICY "Users with manage_employees can delete employees" ON public.employees
    FOR DELETE 
    USING (public.user_has_permission('manage_employees'));

-- ==========================================
-- 2. Update Existing Tables RLS Policies
-- ==========================================

-- Update page_categories policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.page_categories;

CREATE POLICY "Users with manage_employees can manage categories" ON public.page_categories
    FOR ALL 
    USING (public.user_has_permission('manage_employees'));

-- Update pages table policies (if exists)
-- Assuming pages table exists from current system

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view pages" ON public.pages;
DROP POLICY IF EXISTS "Users can manage pages" ON public.pages;

-- Create new policies for pages table
CREATE POLICY "Users with view_team_fb can view pages" ON public.pages
    FOR SELECT 
    USING (public.user_has_permission('view_team_fb') OR public.user_has_permission('view_fb_insights'));

CREATE POLICY "Users with manage_all_fb can manage pages" ON public.pages
    FOR ALL 
    USING (public.user_has_permission('manage_all_fb'));

-- Update tokens table policies (if exists)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tokens" ON public.tokens;
DROP POLICY IF EXISTS "Users can manage tokens" ON public.tokens;

-- Create new policies for tokens table
CREATE POLICY "Users with manage_fb_tokens can view tokens" ON public.tokens
    FOR SELECT 
    USING (public.user_has_permission('manage_fb_tokens'));

CREATE POLICY "Users with manage_fb_tokens can manage tokens" ON public.tokens
    FOR ALL 
    USING (public.user_has_permission('manage_fb_tokens'));

-- Update daily_stats table policies (if exists)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view daily_stats" ON public.daily_stats;

-- Create new policies for daily_stats table
CREATE POLICY "Users with view_fb_insights can view daily_stats" ON public.daily_stats
    FOR SELECT 
    USING (public.user_has_permission('view_fb_insights'));

CREATE POLICY "Users with manage_all_fb can manage daily_stats" ON public.daily_stats
    FOR ALL 
    USING (public.user_has_permission('manage_all_fb'));

-- ==========================================
-- 3. Create Additional Helper Functions
-- ==========================================

-- Function to get user's role name
CREATE OR REPLACE FUNCTION public.get_user_role_name()
RETURNS TEXT AS $$
    SELECT r.name 
    FROM public.roles r
    INNER JOIN public.employees e ON r.id = e.role_id
    WHERE e.id = auth.uid() 
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user has any permission in a category
CREATE OR REPLACE FUNCTION public.user_has_permission_category(category TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.permissions p
        INNER JOIN public.role_permissions rp ON p.id = rp.permission_id
        INNER JOIN public.employees e ON rp.role_id = e.role_id
        WHERE e.id = auth.uid() 
        AND p.category = category
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get all users with specific permission
CREATE OR REPLACE FUNCTION public.get_users_with_permission(permission_id TEXT)
RETURNS TABLE(
    user_id UUID,
    employee_name TEXT,
    role_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as user_id,
        e.first_name || ' ' || e.last_name as employee_name,
        r.name as role_name
    FROM public.employees e
    INNER JOIN public.roles r ON e.role_id = r.id
    INNER JOIN public.role_permissions rp ON r.id = rp.role_id
    WHERE rp.permission_id = permission_id
    AND e.is_active = true
    ORDER BY r.level, e.first_name, e.last_name;
END;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check role hierarchy (can manage lower level roles)
CREATE OR REPLACE FUNCTION public.can_manage_role(target_role_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_level INTEGER;
    target_role_level INTEGER;
BEGIN
    -- Get user's role level
    SELECT r.level INTO user_role_level
    FROM public.roles r
    INNER JOIN public.employees e ON r.id = e.role_id
    WHERE e.id = auth.uid() 
    LIMIT 1;
    
    -- Get target role level
    SELECT level INTO target_role_level
    FROM public.roles
    WHERE id = target_role_id;
    
    -- User can manage if their level is lower (more senior)
    RETURN user_role_level <= target_role_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- 4. Create Audit Logging Function
-- ==========================================

-- Create audit_logs table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.employees(id),
    action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'view_sensitive', 'login'
    table_name TEXT,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only users with view_audit_logs can view audit logs
CREATE POLICY "Users with view_audit_logs can view audit logs" ON public.audit_logs
    FOR SELECT 
    USING (public.user_has_permission('view_audit_logs'));

-- Only system can insert audit logs (or users with manage_users)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT 
    WITH CHECK (public.user_has_permission('manage_users'));

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_old_values JSONB;
    v_new_values JSONB;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_old_values := to_jsonb(OLD);
    END IF;
    
    -- Insert audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        v_action,
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        v_old_values,
        v_new_values
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. Add Audit Triggers to Sensitive Tables
-- ==========================================

-- Add audit trigger to employees table
DROP TRIGGER IF EXISTS employees_audit_trigger ON public.employees;
CREATE TRIGGER employees_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_function();

-- Add audit trigger to roles table
DROP TRIGGER IF EXISTS roles_audit_trigger ON public.roles;
CREATE TRIGGER roles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_function();

-- Add audit trigger to role_permissions table
DROP TRIGGER IF EXISTS role_permissions_audit_trigger ON public.role_permissions;
CREATE TRIGGER role_permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_function();

-- Add audit trigger to fb_accounts table (if sensitive data)
DROP TRIGGER IF EXISTS fb_accounts_audit_trigger ON public.fb_accounts;
CREATE TRIGGER fb_accounts_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.fb_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_function();

-- ==========================================
-- 6. Create Views for Common Queries
-- ==========================================

-- View: Employees with role information
CREATE OR REPLACE VIEW public.employees_with_roles AS
SELECT 
    e.*,
    r.name as role_name,
    r.level as role_level,
    r.description as role_description,
    ARRAY_AGG(p.id) as permissions,
    ARRAY_AGG(p.description) as permission_descriptions
FROM public.employees e
LEFT JOIN public.roles r ON e.role_id = r.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
LEFT JOIN public.permissions p ON rp.permission_id = p.id
GROUP BY e.id, r.name, r.level, r.description;

-- View: Role permissions matrix
CREATE OR REPLACE VIEW public.role_permissions_matrix AS
SELECT 
    r.name as role_name,
    r.level as role_level,
    p.id as permission_id,
    p.description as permission_description,
    p.category as permission_category
FROM public.roles r
INNER JOIN public.role_permissions rp ON r.id = rp.role_id
INNER JOIN public.permissions p ON rp.permission_id = p.id
ORDER BY r.level, p.category, p.description;

-- View: User permissions summary
CREATE OR REPLACE VIEW public.user_permissions_summary AS
SELECT 
    e.id as user_id,
    e.first_name || ' ' || e.last_name as user_name,
    r.name as role_name,
    COUNT(p.id) as permission_count,
    STRING_AGG(p.category, ', ') as permission_categories
FROM public.employees e
LEFT JOIN public.roles r ON e.role_id = r.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
LEFT JOIN public.permissions p ON rp.permission_id = p.id
WHERE e.is_active = true
GROUP BY e.id, e.first_name, e.last_name, r.name
ORDER BY r.level, e.first_name, e.last_name;

-- ==========================================
-- 7. Migration Helper Functions
-- ==========================================

-- Function to verify migration success
CREATE OR REPLACE FUNCTION public.verify_dynamic_rbac_migration()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
DECLARE
    v_old_role_count INTEGER;
    v_new_role_count INTEGER;
    v_employee_with_role_count INTEGER;
    v_total_permission_count INTEGER;
BEGIN
    -- Check if old enum still exists
    SELECT COUNT(*) INTO v_old_role_count
    FROM pg_type 
    WHERE typname = 'user_role';
    
    -- Count new roles
    SELECT COUNT(*) INTO v_new_role_count
    FROM public.roles;
    
    -- Count employees with role_id
    SELECT COUNT(*) INTO v_employee_with_role_count
    FROM public.employees 
    WHERE role_id IS NOT NULL;
    
    -- Count total permissions
    SELECT COUNT(*) INTO v_total_permission_count
    FROM public.permissions;
    
    -- Return results
    RETURN QUERY SELECT 
        'Old enum exists'::TEXT,
        CASE WHEN v_old_role_count > 0 THEN 'WARNING' ELSE 'OK' END,
        'Old user_role enum still exists: ' || v_old_role_count
    UNION ALL
    SELECT 
        'New roles created'::TEXT,
        CASE WHEN v_new_role_count >= 4 THEN 'OK' ELSE 'ERROR' END,
        'New roles count: ' || v_new_role_count
    UNION ALL
    SELECT 
        'Employees migrated'::TEXT,
        CASE WHEN v_employee_with_role_count > 0 THEN 'OK' ELSE 'WARNING' END,
        'Employees with role_id: ' || v_employee_with_role_count
    UNION ALL
    SELECT 
        'Permissions created'::TEXT,
        CASE WHEN v_total_permission_count >= 10 THEN 'OK' ELSE 'ERROR' END,
        'Total permissions: ' || v_total_permission_count;
END;
$$ LANGUAGE sql SECURITY DEFINER;

-- ==========================================
-- 8. Sample Queries for Testing
-- ==========================================

-- Test: Verify migration
/*
SELECT * FROM public.verify_dynamic_rbac_migration();
*/

-- Test: Get current user's permissions
/*
SELECT * FROM public.get_user_permissions();
*/

-- Test: Check if user has specific permission
/*
SELECT public.user_has_permission('manage_employees');
*/

-- Test: Get users with specific permission
/*
SELECT * FROM public.get_users_with_permission('manage_payroll');
*/

-- Test: View employees with roles
/*
SELECT user_name, role_name, permission_count 
FROM public.user_permissions_summary 
ORDER BY role_level, user_name;
*/

-- Test: Check role hierarchy
/*
SELECT public.can_manage_role(
    (SELECT id FROM public.roles WHERE name = 'Staff')
);
*/

-- Test: View audit logs
/*
SELECT * FROM public.audit_logs 
WHERE table_name = 'employees' 
ORDER BY created_at DESC 
LIMIT 10;
*/

-- ==========================================
-- 9. Cleanup Functions (Optional)
-- ==========================================

-- Function to safely remove old enum after verification
CREATE OR REPLACE FUNCTION public.cleanup_old_enum()
RETURNS TEXT AS $$
DECLARE
    v_employee_count INTEGER;
BEGIN
    -- Check if all employees have role_id
    SELECT COUNT(*) INTO v_employee_count
    FROM public.employees 
    WHERE role_id IS NULL;
    
    IF v_employee_count > 0 THEN
        RETURN 'ERROR: Some employees still have no role_id';
    END IF;
    
    -- Drop old enum (commented out for safety)
    -- DROP TYPE IF EXISTS public.user_role;
    
    RETURN 'Ready to cleanup old enum. Manual verification required.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ✅ Phase 1.4 Complete: RLS Policies Update
-- ==========================================
