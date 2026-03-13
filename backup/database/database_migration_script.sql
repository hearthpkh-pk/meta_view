-- ==========================================
-- 🚀 Phase 1.5: Complete Migration Script
-- ==========================================
-- Script สำหรับ migrate จาก Enum-based RBAC ไปเป็น Dynamic RBAC
-- Run this in Supabase SQL Editor step by step

-- ==========================================
-- STEP 1: Backup Current Data
-- ==========================================

-- Create backup tables
CREATE TABLE IF NOT EXISTS public.employees_backup AS
SELECT * FROM public.employees;

CREATE TABLE IF NOT EXISTS public.roles_backup AS
SELECT 
    id,
    email,
    employee_code,
    first_name,
    last_name,
    role as old_role,
    base_salary,
    bank_name,
    bank_account_number,
    is_active,
    created_at,
    updated_at
FROM public.employees;

-- ==========================================
-- STEP 2: Run All Schema Scripts in Order
-- ==========================================

-- 2.1 Run Dynamic RBAC Schema
-- \i database_dynamic_rbac.sql

-- 2.2 Run Payroll Schema  
-- \i database_payroll.sql

-- 2.3 Run FB Accounts Schema
-- \i database_fb_accounts.sql

-- 2.4 Run RLS Update
-- \i database_rls_update.sql

-- ==========================================
-- STEP 3: Verify Migration
-- ==========================================

-- Check migration status
SELECT * FROM public.verify_dynamic_rbac_migration();

-- Check employees with new role assignments
SELECT 
    e.employee_code,
    e.first_name || ' ' || e.last_name as employee_name,
    e.role as old_role,
    r.name as new_role,
    r.level as role_level
FROM public.employees e
LEFT JOIN public.roles r ON e.role_id = r.id
ORDER BY r.level, e.first_name;

-- Check permissions for current user
SELECT 
    category,
    COUNT(*) as permission_count,
    STRING_AGG(description, ', ') as permissions
FROM public.get_user_permissions()
GROUP BY category
ORDER BY category;

-- ==========================================
-- STEP 4: Test Dynamic RBAC
-- ==========================================

-- Test 1: Check if current user can manage employees
SELECT public.user_has_permission('manage_employees') as can_manage_employees;

-- Test 2: Get user's role and permissions
SELECT 
    public.get_user_role_name() as current_role,
    ARRAY_AGG(description) as all_permissions
FROM public.get_user_permissions();

-- Test 3: Check role hierarchy
SELECT 
    r.name as role_name,
    r.level as role_level,
    public.can_manage_role(r.id) as can_manage_this_role
FROM public.roles r
ORDER BY r.level;

-- Test 4: View audit logs (if any)
SELECT 
    action,
    table_name,
    created_at,
    (SELECT first_name || ' ' || last_name FROM public.employees WHERE id = audit_logs.user_id) as user_name
FROM public.audit_logs
ORDER BY created_at DESC
LIMIT 5;

-- ==========================================
-- STEP 5: Update Application Code (Manual)
-- ==========================================

-- After running SQL scripts, update these files:
-- 1. src/stores/AuthStore.js - Update to use dynamic roles
-- 2. src/pages/EmployeeAdminPage.js - Update role management
-- 3. src/App.js - Update route guards
-- 4. Create new components for role/permission management

-- ==========================================
-- STEP 6: Cleanup (Optional - After Verification)
-- ==========================================

-- Only run after confirming everything works correctly

-- 6.1 Remove old role column (after verification)
-- ALTER TABLE public.employees DROP COLUMN role;

-- 6.2 Drop old enum (after verification)
-- DROP TYPE IF EXISTS public.user_role;

-- 6.3 Remove backup tables (after final verification)
-- DROP TABLE IF EXISTS public.employees_backup;
-- DROP TABLE IF EXISTS public.roles_backup;

-- ==========================================
-- STEP 7: Performance Optimization
-- ==========================================

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON public.leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_period ON public.payroll_records(employee_id, year, month);

-- ==========================================
-- STEP 8: Final Verification
-- ==========================================

-- Check all tables exist and have data
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'employees', 'roles', 'permissions', 'role_permissions',
        'payroll_records', 'leave_requests', 'leave_balances',
        'fb_accounts', 'account_pages', 'employee_fb_access',
        'audit_logs'
    )
ORDER BY tablename;

-- Check RLS is enabled on all tables
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'employees', 'roles', 'permissions', 'role_permissions',
        'payroll_records', 'leave_requests', 'leave_balances',
        'fb_accounts', 'account_pages', 'employee_fb_access',
        'audit_logs'
    )
ORDER BY tablename;

-- ==========================================
-- 🎯 Migration Complete Checklist
-- ==========================================

-- [ ] Backup created successfully
-- [ ] Dynamic RBAC schema applied
-- [ ] Payroll schema applied  
-- [ ] FB Accounts schema applied
-- [ ] RLS policies updated
-- [ ] All employees have role assignments
-- [ ] Permissions assigned correctly
-- [ ] Audit logging working
-- [ ] Performance indexes created
-- [ ] Application code updated
-- [ ] All tests passing
-- [ ] Backup tables removed (optional)

-- ==========================================
-- ✅ Phase 1.5 Complete: Migration Script
-- ==========================================
