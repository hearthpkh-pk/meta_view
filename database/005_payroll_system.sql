-- ==========================================
-- 005: Payroll System (Records & Taxes)
-- ==========================================
-- This script sets up the payroll recording system using standard integers.

-- 1. Payroll Records Table
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    
    -- Salary Components (Integer for simple currency, no Satang/decimals)
    base_salary INTEGER NOT NULL DEFAULT 0,
    overtime_pay INTEGER DEFAULT 0,
    sales_commission INTEGER DEFAULT 0,
    performance_bonus INTEGER DEFAULT 0,
    other_allowances INTEGER DEFAULT 0,
    
    -- Deductions
    tax_deduction INTEGER DEFAULT 0,
    social_security INTEGER DEFAULT 0,
    other_deductions INTEGER DEFAULT 0,
    
    -- Final Calculation (Simple Addition/Subtraction)
    net_payable INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate records for same employee/month/year
    UNIQUE(employee_id, month, year)
);

-- 2. Enable RLS
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- 3. Payroll RLS Policies
DROP POLICY IF EXISTS "Staff can view own payroll" ON public.payroll_records;
CREATE POLICY "Staff can view own payroll" ON public.payroll_records
    FOR SELECT USING (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Admins manage all payroll" ON public.payroll_records;
CREATE POLICY "Admins manage all payroll" ON public.payroll_records
    FOR ALL USING (public.user_has_permission('manage_payroll'));

-- 4. updated_at Trigger
DROP TRIGGER IF EXISTS payroll_updated_at ON public.payroll_records;
CREATE TRIGGER payroll_updated_at BEFORE UPDATE ON public.payroll_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();
