-- ==========================================
-- 002: Dynamic RBAC System (Roles & Permissions)
-- ==========================================
-- This script implements the 4-level role system and dynamic permissions.

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    level INTEGER NOT NULL, -- 0: Super Admin, 10: Admin, 20: Manager, 30: Staff
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY, -- e.g., 'manage_employees'
    description TEXT,
    category TEXT,       -- e.g., 'Employee'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Junction Table: Role-Permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Connect Employees to Roles (Add constraint if table exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='role_id') THEN
        ALTER TABLE public.employees ADD COLUMN role_id UUID REFERENCES public.roles(id);
    END IF;
END $$;

-- 5. Permission Checker Function
DROP FUNCTION IF EXISTS public.user_has_permission(TEXT);
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.role_permissions rp
        JOIN public.employees e ON rp.role_id = e.role_id
        WHERE e.id = auth.uid() 
        AND rp.permission_id = permission_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. Insert Permissions
INSERT INTO public.permissions (id, description, category) VALUES
    -- Employee Management
    ('view_all_employees', 'ดูรายชื่อพนักงานทั้งหมด', 'Employee'),
    ('manage_employees', 'จัดการพนักงาน (เพิ่ม/ลด/แก้ไข)', 'Employee'),
    ('manage_roles', 'จัดการสิทธิ์และหน้าที่ (Roles)', 'System'),
    
    -- FB Management
    ('manage_all_fb', 'จัดการบัญชีและเพจ FB ทั้งหมด', 'Facebook'),
    ('manage_own_fb', 'จัดการบัญชีและเพจ FB ที่ได้รับมอบหมาย', 'Facebook'),
    ('view_team_fb', 'ดูข้อมูล FB ของทีม', 'Facebook'),
    ('view_fb_insights', 'ดูสถิติและ Insights ของ FB', 'Facebook'),
    ('manage_fb_tokens', 'จัดการ Tokens และระบบเชื่อมต่อ FB', 'Facebook')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description, category = EXCLUDED.category;

-- 7. Insert Simplified 4 Roles
INSERT INTO public.roles (name, description, level) VALUES
    ('Super Admin', 'เจ้าของระบบ', 0),
    ('Admin', 'ผู้จัดการ', 10),
    ('Manager', 'หัวหน้าทีม', 20),
    ('Staff', 'พนักงานทั่วไป', 30)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, level = EXCLUDED.level;

-- 8. Assign Permissions
-- Super Admin: All
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Admin: Most except roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p WHERE r.name = 'Admin' AND p.id != 'manage_roles'
ON CONFLICT DO NOTHING;

-- Manager: Team FB & Insights
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p 
WHERE r.name = 'Manager' AND p.id IN ('view_all_employees', 'view_team_fb', 'view_fb_insights')
ON CONFLICT DO NOTHING;

-- Staff: Own FB
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p 
WHERE r.name = 'Staff' AND p.id IN ('manage_own_fb', 'view_fb_insights')
ON CONFLICT DO NOTHING;

-- 9. Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
