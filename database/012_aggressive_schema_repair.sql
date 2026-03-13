-- ========================================================
-- 012: Aggressive Schema Repair - Pages Table
-- (Fixes: "null value in column 'page_id' violates not-null constraint")
-- ========================================================

DO $$ BEGIN
    -- 1. If 'page_id' exists and it's NOT the primary key 'id', 
    -- we check if we should rename it or drop it.
    
    -- Case A: 'page_id' is TEXT (the old name for 'fb_page_id')
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='page_id' AND data_type='text') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='fb_page_id') THEN
            -- Rename it if fb_page_id doesn't exist yet
            ALTER TABLE public.pages RENAME COLUMN page_id TO fb_page_id;
        ELSE
            -- If both exist, 'page_id' is likely a ghost. Drop its NOT NULL constraint or drop column.
            -- To be safe, we just make it nullable first.
            ALTER TABLE public.pages ALTER COLUMN page_id DROP NOT NULL;
            -- Or if we are sure it's redundant:
            -- ALTER TABLE public.pages DROP COLUMN page_id;
        END IF;
    END IF;

    -- Case B: 'page_id' is UUID (an old PK name)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='page_id' AND data_type='uuid') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='id') THEN
            ALTER TABLE public.pages RENAME COLUMN page_id TO id;
        ELSE
            -- Redundant UUID column
            ALTER TABLE public.pages ALTER COLUMN page_id DROP NOT NULL;
        END IF;
    END IF;

    -- 2. Ensure 'fb_page_id' is NOT NULL if we want it to be mandatory
    -- But only after we ensure we aren't breaking existing nulls.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='fb_page_id') THEN
        -- We don't set to NOT NULL yet to avoid error during migration if data exists.
        -- ALTER TABLE public.pages ALTER COLUMN fb_page_id SET NOT NULL; 
    ELSE
        -- Create it if missing
        ALTER TABLE public.pages ADD COLUMN fb_page_id TEXT;
    END IF;

END $$;

-- 3. Touch the table to force refresh
COMMENT ON COLUMN public.pages.fb_page_id IS 'Facebook Page ID (e.g. 123456789)';
