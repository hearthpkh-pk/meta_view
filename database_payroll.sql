-- ==========================================
-- 🚀 Phase 1.2: Payroll System Database Schema
-- ==========================================
-- สร้างตารางสำหรับระบบเงินเดือนและการลางาน
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. Create Payroll Records Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    
    -- Salary Components (BigInt for precision, no floating point)
    base_salary BIGINT NOT NULL DEFAULT 0,  -- เงินเดือนพื้นฐาน (สกุล: สตางค์)
    overtime_hours INTEGER DEFAULT 0,  -- ชั่วโมง OT
    overtime_rate BIGINT DEFAULT 0,  -- อัตราค่า OT ต่อชั่วโมง
    overtime_pay BIGINT DEFAULT 0,  -- ค่า OT รวม
    
    -- Commissions & Bonuses
    sales_commission BIGINT DEFAULT 0,  -- ค่าคอมมิชชัน
    performance_bonus BIGINT DEFAULT 0,  -- โบนัสผลงาน
    other_allowances BIGINT DEFAULT 0,  -- เบี้ยอื่นๆ
    
    -- Deductions
    late_deduction BIGINT DEFAULT 0,  -- หักเงินขาด/สาย
    absence_days INTEGER DEFAULT 0,  -- วันขาดงาน
    absence_deduction BIGINT DEFAULT 0,  -- หักเงินขาดงาน
    tax_deduction BIGINT DEFAULT 0,  -- หักภาษี
    social_security BIGINT DEFAULT 0,  -- ประกันสังคม
    other_deductions BIGINT DEFAULT 0,  -- หักอื่นๆ
    
    -- Calculations
    gross_income BIGINT GENERATED ALWAYS AS (
        base_salary + overtime_pay + sales_commission + performance_bonus + other_allowances
    ) STORED,
    
    total_deductions BIGINT GENERATED ALWAYS AS (
        late_deduction + absence_deduction + tax_deduction + social_security + other_deductions
    ) STORED,
    
    net_salary BIGINT GENERATED ALWAYS AS (
        gross_income - total_deductions
    ) STORED,
    
    -- Metadata
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'paid')),
    notes TEXT,
    approved_by UUID REFERENCES public.employees(id),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.employees(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. Create Leave Requests Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    
    -- Leave Details
    leave_type TEXT NOT NULL CHECK (leave_type IN (
        'ลาป่วย', 'ลากิจ', 'ลาพักผ่อน', 'ลาคลอด', 'ลาสมรสภาพ', 'ลาอื่นๆ'
    )),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER GENERATED ALWAYS AS (
        GREATEST(0, (end_date - start_date) + 1)
    ) STORED,
    
    -- Reason & Attachments
    reason TEXT,
    attachment_url TEXT,  -- สำหรับใบรับรองการลา
    
    -- Approval Workflow
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'cancelled'
    )),
    approved_by UUID REFERENCES public.employees(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Leave Balance Tracking
    sick_days_used INTEGER DEFAULT 0,  -- วันลาป่วยที่ใช้ไปในปีนี้
    personal_days_used INTEGER DEFAULT 0,  -- วันลากิจที่ใช้ไปในปีนี้
    vacation_days_used INTEGER DEFAULT 0,  -- วันลาพักผ่อนที่ใช้ไปในปีนี้
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Create Leave Balance Table (Optional - for tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    
    -- Leave Entitlements
    sick_days_entitled INTEGER DEFAULT 30,  -- สิทธิลาป่วยต่อปี
    personal_days_entitled INTEGER DEFAULT 6,  -- สิทธิลากิจต่อปี
    vacation_days_entitled INTEGER DEFAULT 6,  -- สิทธิลาพักผ่อนต่อปี
    
    -- Leave Used (Calculated from leave_requests)
    sick_days_used INTEGER DEFAULT 0,
    personal_days_used INTEGER DEFAULT 0,
    vacation_days_used INTEGER DEFAULT 0,
    
    -- Leave Remaining
    sick_days_remaining INTEGER GENERATED ALWAYS AS (
        sick_days_entitled - sick_days_used
    ) STORED,
    
    personal_days_remaining INTEGER GENERATED ALWAYS AS (
        personal_days_entitled - personal_days_used
    ) STORED,
    
    vacation_days_remaining INTEGER GENERATED ALWAYS AS (
        vacation_days_entitled - vacation_days_used
    ) STORED,
    
    UNIQUE(employee_id, year),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. Create Indexes for Performance
-- ==========================================

-- Payroll Records Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON public.payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month_year ON public.payroll_records(month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON public.payroll_records(status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON public.payroll_records(year, month, employee_id);

-- Leave Requests Indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_type ON public.leave_requests(leave_type);

-- Leave Balances Indexes
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON public.leave_balances(employee_id, year);

-- ==========================================
-- 5. Enable RLS (Row Level Security)
-- ==========================================
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. Create RLS Policies for Payroll Tables
-- ==========================================

-- Payroll Records Policies
-- Users can view their own payroll
CREATE POLICY "Employees can view own payroll" ON public.payroll_records
    FOR SELECT USING (auth.uid() = employee_id);

-- Users with manage_payroll can view all payroll
CREATE POLICY "Payroll managers can view all payroll" ON public.payroll_records
    FOR SELECT USING (public.user_has_permission('manage_payroll'));

-- Users with approve_payroll can view all payroll
CREATE POLICY "Payroll approvers can view all payroll" ON public.payroll_records
    FOR SELECT USING (public.user_has_permission('approve_payroll'));

-- Only payroll managers can create/update payroll
CREATE POLICY "Payroll managers can manage payroll" ON public.payroll_records
    FOR ALL USING (public.user_has_permission('manage_payroll'));

-- Leave Requests Policies
-- Users can view their own leave requests
CREATE POLICY "Employees can view own leave requests" ON public.leave_requests
    FOR SELECT USING (auth.uid() = employee_id);

-- Users with view_team_leaves can view team leaves
CREATE POLICY "Managers can view team leave requests" ON public.leave_requests
    FOR SELECT USING (
        public.user_has_permission('view_team_leaves') OR
        public.user_has_permission('approve_leave')
    );

-- Users can create their own leave requests
CREATE POLICY "Employees can create own leave requests" ON public.leave_requests
    FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- Leave approvers can update leave requests
CREATE POLICY "Leave approvers can manage leave requests" ON public.leave_requests
    FOR UPDATE USING (public.user_has_permission('approve_leave'));

-- Leave Balances Policies
-- Users can view their own leave balances
CREATE POLICY "Employees can view own leave balances" ON public.leave_balances
    FOR SELECT USING (auth.uid() = employee_id);

-- Managers can view team leave balances
CREATE POLICY "Managers can view team leave balances" ON public.leave_balances
    FOR SELECT USING (public.user_has_permission('view_team_leaves'));

-- ==========================================
-- 7. Create Helper Functions for Payroll
-- ==========================================

-- Function to calculate monthly payroll for an employee
CREATE OR REPLACE FUNCTION public.calculate_monthly_payroll(
    p_employee_id UUID,
    p_month INTEGER,
    p_year INTEGER
)
RETURNS TABLE(
    base_salary BIGINT,
    overtime_pay BIGINT,
    gross_income BIGINT,
    total_deductions BIGINT,
    net_salary BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(pr.base_salary, 0),
        COALESCE(pr.overtime_pay, 0),
        COALESCE(pr.gross_income, 0),
        COALESCE(pr.total_deductions, 0),
        COALESCE(pr.net_salary, 0)
    FROM public.payroll_records pr
    WHERE pr.employee_id = p_employee_id
    AND pr.month = p_month
    AND pr.year = p_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update leave balance
CREATE OR REPLACE FUNCTION public.update_leave_balance(
    p_employee_id UUID,
    p_year INTEGER,
    p_leave_type TEXT,
    p_days INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Update or create leave balance record
    INSERT INTO public.leave_balances (employee_id, year)
    VALUES (p_employee_id, p_year)
    ON CONFLICT (employee_id, year) DO NOTHING;
    
    -- Update used days based on leave type
    UPDATE public.leave_balances lb
    SET 
        sick_days_used = CASE 
            WHEN p_leave_type = 'ลาป่วย' THEN lb.sick_days_used + p_days
            ELSE lb.sick_days_used
        END,
        personal_days_used = CASE 
            WHEN p_leave_type = 'ลากิจ' THEN lb.personal_days_used + p_days
            ELSE lb.personal_days_used
        END,
        vacation_days_used = CASE 
            WHEN p_leave_type = 'ลาพักผ่อน' THEN lb.vacation_days_used + p_days
            ELSE lb.vacation_days_used
        END,
        updated_at = NOW()
    WHERE lb.employee_id = p_employee_id AND lb.year = p_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check leave availability
CREATE OR REPLACE FUNCTION public.check_leave_availability(
    p_employee_id UUID,
    p_leave_type TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    available BOOLEAN,
    days_requested INTEGER,
    days_remaining INTEGER,
    message TEXT
) AS $$
DECLARE
    v_days_requested INTEGER;
    v_days_remaining INTEGER;
    v_year INTEGER;
BEGIN
    v_days_requested := (p_end_date - p_start_date) + 1;
    v_year := EXTRACT(YEAR FROM p_start_date);
    
    -- Get current leave balance
    SELECT 
        CASE p_leave_type
            WHEN 'ลาป่วย' THEN sick_days_remaining
            WHEN 'ลากิจ' THEN personal_days_remaining
            WHEN 'ลาพักผ่อน' THEN vacation_days_remaining
            ELSE 0
        END INTO v_days_remaining
    FROM public.leave_balances
    WHERE employee_id = p_employee_id AND year = v_year;
    
    -- Return result
    RETURN QUERY SELECT 
        (v_days_remaining >= v_days_requested),
        v_days_requested,
        v_days_remaining,
        CASE 
            WHEN v_days_remaining >= v_days_requested THEN 'สามารถลาได้'
            ELSE 'ไม่สามารถลาได้: วันลาเกินสิทธิ'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. Create Triggers for Updated Timestamps
-- ==========================================

-- Payroll Records trigger
CREATE OR REPLACE FUNCTION update_payroll_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payroll_records_updated_at ON public.payroll_records;
CREATE TRIGGER payroll_records_updated_at
    BEFORE UPDATE ON public.payroll_records
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_records_updated_at();

-- Leave Requests trigger
CREATE OR REPLACE FUNCTION update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER leave_requests_updated_at
    BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_requests_updated_at();

-- Leave Balances trigger
CREATE OR REPLACE FUNCTION update_leave_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_balances_updated_at ON public.leave_balances;
CREATE TRIGGER leave_balances_updated_at
    BEFORE UPDATE ON public.leave_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_balances_updated_at();

-- ==========================================
-- 9. Create Trigger for Auto-Update Leave Balance
-- ==========================================
CREATE OR REPLACE FUNCTION auto_update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- When leave request is approved, update leave balance
    IF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
        PERFORM public.update_leave_balance(
            NEW.employee_id,
            EXTRACT(YEAR FROM NEW.start_date),
            NEW.leave_type,
            NEW.total_days
        );
    END IF;
    
    -- When leave request is cancelled after approval, restore balance
    IF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status = 'cancelled' THEN
        PERFORM public.update_leave_balance(
            NEW.employee_id,
            EXTRACT(YEAR FROM NEW.start_date),
            NEW.leave_type,
            -OLD.total_days  -- Negative to restore
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_leave_balance_trigger ON public.leave_requests;
CREATE TRIGGER auto_update_leave_balance_trigger
    AFTER INSERT OR UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_leave_balance();

-- ==========================================
-- 10. Initialize Leave Balances for Current Employees
-- ==========================================
-- Create leave balances for all existing employees for current year
INSERT INTO public.leave_balances (employee_id, year)
SELECT 
    id,
    EXTRACT(YEAR FROM CURRENT_DATE)
FROM public.employees
WHERE is_active = true
ON CONFLICT (employee_id, year) DO NOTHING;

-- ==========================================
-- 11. Sample Queries for Testing
-- ==========================================

-- Test: Get payroll for employee
/*
SELECT * FROM public.calculate_monthly_payroll('employee-uuid', 12, 2023);
*/

-- Test: Check leave availability
/*
SELECT * FROM public.check_leave_availability('employee-uuid', 'ลาป่วย', '2023-12-01', '2023-12-03');
*/

-- Test: Get leave requests for approval
/*
SELECT 
    lr.*,
    e.first_name,
    e.last_name
FROM public.leave_requests lr
INNER JOIN public.employees e ON lr.employee_id = e.id
WHERE lr.status = 'pending'
ORDER BY lr.created_at;
*/

-- ==========================================
-- ✅ Phase 1.2 Complete: Payroll System Schema
-- ==========================================
