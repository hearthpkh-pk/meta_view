-- วางโค้ดนี้ใน Supabase SQL Editor แล้วกด Run เพื่อเพิ่มคอลัมน์บัญชีธนาคาร
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(20);

-- รีเฟรช Schema Cache
NOTIFY pgrst, 'reload schema';
