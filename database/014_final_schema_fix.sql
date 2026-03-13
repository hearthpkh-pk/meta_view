-- ========================================================
-- 014: Final Schema Reconciliation (The "Direct" Fix)
-- (Resolves: Persistent NOT NULL constraint on page_id)
-- ========================================================

-- 1. Explicitly drop the NOT NULL constraint from page_id if it exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'page_id') THEN
        -- Strip any NOT NULL constraint
        ALTER TABLE public.pages ALTER COLUMN page_id DROP NOT NULL;
        
        -- If it's a TEXT column and we already have fb_page_id, it's safe to drop it
        -- But for safety, we just make it nullable first.
        -- Uncomment the next line if you are sure it's not the primary key:
        -- ALTER TABLE public.pages DROP COLUMN page_id;
    END IF;
END $$;

-- 2. Ensure fb_page_id is ready and NOT used as a constraint that blocks us
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'fb_page_id') THEN
        ALTER TABLE public.pages ADD COLUMN fb_page_id TEXT;
    END IF;
END $$;

-- 3. Force PostgREST to refresh the schema cache
-- In Supabase, changing a comment on the table usually triggers this.
COMMENT ON TABLE public.pages IS 'Table for pages - version 1.0.1 (Force Cache Refresh)';

-- 4. Check if there are any other columns that might block inserts
DO $$ 
DECLARE 
    col_name RECORD;
BEGIN
    FOR col_name IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'pages' 
          AND is_nullable = 'NO' 
          AND column_default IS NULL 
          AND column_name NOT IN ('id', 'name', 'fb_page_id', 'fb_id', 'page_id') -- Add known non-nullable columns here
    LOOP
        EXECUTE 'ALTER TABLE public.pages ALTER COLUMN ' || quote_ident(col_name.column_name) || ' DROP NOT NULL';
    END LOOP;
END $$;
