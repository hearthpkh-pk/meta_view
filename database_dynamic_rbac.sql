-- ==========================================
-- 🚀 Phase 1.1: Dynamic RBAC Database Schema
-- ==========================================
-- แปลงจาก Enum-based ไปเป็น Dynamic RBAC System
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. Create Dynamic Permissions Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,  -- เช่น 'manage_payroll', 'manage_all_fb', 'view_team_fb'
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general',  -- เช่น 'payroll', 'facebook', 'employees', 'system'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. Create Dynamic Roles Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- เช่น 'CEO', 'Senior Admin', 'Content Staff'
    description TEXT,
    level INTEGER DEFAULT 0,  -- สำหรับ hierarchy (0=highest, 100=lowest)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Create Role-Permissions Junction Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- ==========================================
-- 4. Insert Default Permissions
-- ==========================================
INSERT INTO public.permissions (id, description, category) VALUES
    -- System Permissions
    ('manage_users', 'จัดการผู้ใช้ระบบ', 'system'),
    ('manage_roles', 'จัดการสิทธิ์และบทบาท', 'system'),
    ('view_audit_logs', 'ดูประวัติการใช้งาน', 'system'),
    
    -- Employee Permissions
    ('view_all_employees', 'ดูข้อมูลพนักงานทั้งหมด', 'employees'),
    ('manage_employees', 'จัดการข้อมูลพนักงาน', 'employees'),
    ('view_own_profile', 'ดูข้อมูลส่วนตัว', 'employees'),
    
    -- Payroll Permissions
    ('manage_payroll', 'จัดการระบบเงินเดือน', 'payroll'),
    ('view_payroll_reports', 'ดูรายงานเงินเดือน', 'payroll'),
    ('approve_payroll', 'อนุมัติเงินเดือน', 'payroll'),
    
    -- Facebook Permissions
    ('manage_all_fb', 'จัดการบัญชี Facebook ทั้งหมด', 'facebook'),
    ('view_team_fb', 'ดูบัญชี Facebook ของทีม', 'facebook'),
    ('manage_own_fb', 'จัดการบัญชี Facebook ของตัวเอง', 'facebook'),
    ('view_fb_insights', 'ดูสถิติ Facebook', 'facebook'),
    ('manage_fb_tokens', 'จัดการ Meta API Tokens', 'facebook'),
    
    -- Leave Permissions
    ('request_leave', 'ขอลางาน', 'leaves'),
    ('approve_leave', 'อนุมัติการลางาน', 'leaves'),
    ('view_team_leaves', 'ดูการลางานของทีม', 'leaves')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 5. Insert Default Roles
-- ==========================================
INSERT INTO public.roles (name, description, level) VALUES
    ('Super Admin', 'เจ้าของระบบ - สิทธิ์สูงสุด', 0),
    ('CEO', 'ประธานบริษัท', 10),
    ('Admin', 'ผู้จัดการระบบ', 20),
    ('HR Manager', 'ผู้จัดการฝ่ายบุคคล', 30),
    ('Finance Manager', 'ผู้จัดการการเงิน', 40),
    ('Manager', 'หัวหน้าทีม', 50),
    ('Senior Staff', 'พนักงานอาวุโส', 60),
    ('Staff', 'พนักงานทั่วไป', 70)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 6. Assign Permissions to Roles
-- ==========================================
-- Super Admin - All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CEO - Most permissions except system management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'CEO' AND p.id NOT IN ('manage_users', 'manage_roles')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin - Employee, Facebook, Payroll management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Admin' AND p.id IN (
    'view_all_employees', 'manage_employees',
    'manage_all_fb', 'view_team_fb', 'view_fb_insights', 'manage_fb_tokens',
    'view_team_leaves', 'approve_leave'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HR Manager - Employee and Leave management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'HR Manager' AND p.id IN (
    'view_all_employees', 'manage_employees',
    'view_team_leaves', 'approve_leave',
    'view_own_profile'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Finance Manager - Payroll focused
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Finance Manager' AND p.id IN (
    'manage_payroll', 'view_payroll_reports', 'approve_payroll',
    'view_all_employees'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager - Team management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Manager' AND p.id IN (
    'view_all_employees', 'view_team_fb', 'view_team_leaves', 'approve_leave',
    'view_own_profile'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Senior Staff - Extended staff permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Senior Staff' AND p.id IN (
    'view_team_fb', 'manage_own_fb', 'view_fb_insights',
    'request_leave', 'view_team_leaves',
    'view_own_profile'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Staff - Basic permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Staff' AND p.id IN (
    'manage_own_fb', 'view_fb_insights',
    'request_leave',
    'view_own_profile'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==========================================
-- 7. Update Employees Table to Use Dynamic Roles
-- ==========================================
-- Add role_id column if not exists
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_employees_role_id ON public.employees(role_id);

-- ==========================================
-- 8. Migration: Map Existing Enum Roles to Dynamic Roles
-- ==========================================
-- Create temporary mapping
CREATE TEMPORARY TABLE role_mapping AS
SELECT 
    e.id as employee_id,
    e.role as old_role,
    r.id as new_role_id
FROM public.employees e
LEFT JOIN public.roles r ON 
    CASE e.role
        WHEN 'super_admin' THEN 'Super Admin'
        WHEN 'admin' THEN 'Admin'
        WHEN 'manager' THEN 'Manager'
        WHEN 'staff' THEN 'Staff'
        ELSE 'Staff'
    END = r.name;

-- Update employees with new role_id
UPDATE public.employees e
SET role_id = m.new_role_id
FROM role_mapping m
WHERE e.id = m.employee_id;

-- Drop temporary table
DROP TABLE IF EXISTS role_mapping;

-- ==========================================
-- 9. Enable RLS for New Tables
-- ==========================================
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 10. Create RLS Policies for Dynamic RBAC Tables
-- ==========================================

-- Permissions Table - Read-only for authenticated users
CREATE POLICY "Allow read permissions for authenticated users" ON public.permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Roles Table - Read-only for authenticated users
CREATE POLICY "Allow read roles for authenticated users" ON public.roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Role-Permissions Table - Read-only for authenticated users
CREATE POLICY "Allow read role permissions for authenticated users" ON public.role_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- ==========================================
-- 11. Create Helper Functions for Dynamic RBAC
-- ==========================================

-- Function to get user's role_id
CREATE OR REPLACE FUNCTION public.get_user_role_id()
RETURNS UUID AS $$
    SELECT role_id FROM public.employees WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_id UUID;
BEGIN
    -- Get user's role_id
    SELECT role_id INTO user_role_id 
    FROM public.employees 
    WHERE id = auth.uid() LIMIT 1;
    
    -- Check if role has the permission
    RETURN EXISTS (
        SELECT 1 
        FROM public.role_permissions rp
        WHERE rp.role_id = user_role_id 
        AND rp.permission_id = permission_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get user's permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS TABLE(permission_id TEXT, description TEXT, category TEXT) AS $$
    SELECT p.id, p.description, p.category
    FROM public.permissions p
    INNER JOIN public.role_permissions rp ON p.id = rp.permission_id
    INNER JOIN public.employees e ON rp.role_id = e.role_id
    WHERE e.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- 12. Create Triggers for Updated Timestamps
-- ==========================================

-- Permissions table trigger
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS permissions_updated_at ON public.permissions;
CREATE TRIGGER permissions_updated_at
    BEFORE UPDATE ON public.permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_permissions_updated_at();

-- Roles table trigger
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;
CREATE TRIGGER roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();

-- ==========================================
-- 13. Sample Queries for Testing
-- ==========================================

-- Test: Get all permissions for current user
/*
SELECT * FROM public.get_user_permissions();
*/

-- Test: Check if user has specific permission
/*
SELECT public.user_has_permission('manage_payroll');
*/

-- Test: Get role name for current user
/*
SELECT r.name 
FROM public.roles r
INNER JOIN public.employees e ON r.id = e.role_id
WHERE e.id = auth.uid();
*/

-- ==========================================
-- 14. Clean Up (Optional - Remove after Migration)
-- ==========================================

-- After confirming migration works, you can:
-- 1. Drop the old role column from employees table
-- ALTER TABLE public.employees DROP COLUMN role;

-- 2. Drop the old user_role enum
-- DROP TYPE IF EXISTS public.user_role;

-- ==========================================
-- ✅ Phase 1.1 Complete: Dynamic RBAC Schema
-- ==========================================
