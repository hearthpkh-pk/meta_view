-- SQL Script for creating page_categories table
-- Run this in your Supabase SQL Editor

-- Create page_categories table
CREATE TABLE IF NOT EXISTS page_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add category_id column to pages table if it doesn't exist
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES page_categories(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pages_category_id ON pages(category_id);

-- Enable Row Level Security (RLS)
ALTER TABLE page_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for page_categories (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON page_categories
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Insert default categories
INSERT INTO page_categories (name, color, sort_order) VALUES
    ('หน้าหลัก', '#3B82F6', 1),
    ('ข่าวสาร', '#10B981', 2),
    ('บันเทิง', '#F59E0B', 3),
    ('ธุรกิจ', '#8B5CF6', 4),
    ('อื่นๆ', '#6B7280', 5)
ON CONFLICT DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_page_categories_updated_at 
    BEFORE UPDATE ON page_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
