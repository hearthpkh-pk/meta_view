-- 1. Create Role Enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'manager', 'staff');
    END IF;
END$$;

-- 2. Create Employees Table (Extends auth.users) if it doesn't exist
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role public.user_role DEFAULT 'staff'::public.user_role NOT NULL,
  base_salary DECIMAL(15, 2) DEFAULT 0.00,
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(20),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Helper function for RLS on this and other tables
-- Placed here before policies so it can be used by them.
-- SECURITY DEFINER allows it to read the table without triggering RLS infinite loops.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.employees WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Create Policies for employees table

-- DROP Old Policies first to avoid "already exists" errors
DROP POLICY IF EXISTS "Employees can view own profile" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Super Admins can manage employees" ON public.employees;

-- Rule 1: Employees can view their own profile
CREATE POLICY "Employees can view own profile" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = id);

-- Rule 2: Admins/Super Admins can view all employees
CREATE POLICY "Admins can view all employees" 
ON public.employees 
FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'super_admin')
);

-- Rule 3: Only Super Admins can insert/update employees
CREATE POLICY "Super Admins can manage employees" 
ON public.employees 
FOR ALL
USING (
  public.get_user_role() = 'super_admin'
);

-- 5. Trigger to automatically handle updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employees_updated_at ON public.employees;
CREATE TRIGGER employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 6. Helper function for RLS on OTHER tables later (Optional, dropping old version if exists)
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
