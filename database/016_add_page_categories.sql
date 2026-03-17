-- Create page_categories table
CREATE TABLE IF NOT EXISTS public.page_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_categories ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Public read for now, admin write)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.page_categories;
CREATE POLICY "Enable read access for all users" ON public.page_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.page_categories;
CREATE POLICY "Enable insert for authenticated users" ON public.page_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.page_categories;
CREATE POLICY "Enable update for authenticated users" ON public.page_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.page_categories;
CREATE POLICY "Enable delete for authenticated users" ON public.page_categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert Default Categories (Thai)
INSERT INTO public.page_categories (name, sort_order, color) VALUES
('หน้าหลัก', 1, '#3B82F6'),
('รายการ', 2, '#10B981'),
('หนัง', 3, '#F59E0B'),
('ข่าว', 4, '#8B5CF6'),
('อื่นๆ', 5, '#6B7280')
ON CONFLICT DO NOTHING;

-- Ensure pages table has order_index
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='order_index') THEN
        ALTER TABLE public.pages ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
    -- Ensure pages table has page_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='page_type') THEN
        ALTER TABLE public.pages ADD COLUMN page_type TEXT;
    END IF;
END $$;
