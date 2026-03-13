-- ==========================================
-- 001: Initial Setup (Employees & Groups)
-- ==========================================
-- This script sets up the core tables for the system.
-- It ensures idempotency using IF NOT EXISTS and DROP IF EXISTS.

-- 1. Create Employees Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email TEXT,
    role_id UUID, -- Will be linked in 002_dynamic_rbac
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Page Categories (Groups for FB Pages)
CREATE TABLE IF NOT EXISTS public.page_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_categories ENABLE ROW LEVEL SECURITY;

-- 4. Shared Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach Triggers
DROP TRIGGER IF EXISTS employees_updated_at ON public.employees;
CREATE TRIGGER employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_page_categories_updated_at ON public.page_categories;
CREATE TRIGGER update_page_categories_updated_at 
BEFORE UPDATE ON public.page_categories 
FOR EACH ROW 
EXECUTE FUNCTION set_updated_at();

-- 6. Insert Default Categories
INSERT INTO public.page_categories (name, color, sort_order) VALUES
    ('หน้าหลัก', '#3B82F6', 1),
    ('ข่าวสาร', '#10B981', 2),
    ('บันเทิง', '#F59E0B', 3),
    ('ธุรกิจ', '#8B5CF6', 4),
    ('อื่นๆ', '#6B7280', 5)
ON CONFLICT DO NOTHING;
