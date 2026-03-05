-- วางโค้ดนี้ใน Supabase SQL Editor แล้วกด Run เพื่อเพิ่มคอลัมน์เงินเดือน
ALTER TABLE IF EXISTS public.employees 
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(15, 2) DEFAULT 0.00;
