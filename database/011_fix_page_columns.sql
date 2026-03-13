-- ========================================================
-- 011: Fix Page Columns & Schema Inconsistency
-- (Resolves: "Could not find the 'fb_page_id' column of 'pages'")
-- ========================================================

DO $$ BEGIN
    -- 1. Rename 'page_id' to 'fb_page_id' if 'page_id' exists as TEXT
    -- and 'fb_page_id' does NOT exist.
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pages' 
        AND column_name = 'page_id' 
        AND data_type = 'text'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pages' 
        AND column_name = 'fb_page_id'
    ) THEN
        ALTER TABLE public.pages RENAME COLUMN page_id TO fb_page_id;
    END IF;

    -- 2. If 'fb_page_id' STILL doesn't exist, create it.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pages' 
        AND column_name = 'fb_page_id'
    ) THEN
        ALTER TABLE public.pages ADD COLUMN fb_page_id TEXT;
        -- If we have old data, we might need a default, but for now we keep it nullable or manual.
        -- ALTER TABLE public.pages ALTER COLUMN fb_page_id SET NOT NULL; -- Optional
    END IF;

    -- 3. Ensure uniqueness if it doesn't have it (Best practice for FB Page IDs)
    -- We use a safe check to avoid errors if the constraint already exists.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'pages' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'pages_fb_page_id_key'
    ) THEN
        BEGIN
            ALTER TABLE public.pages ADD CONSTRAINT pages_fb_page_id_key UNIQUE (fb_page_id);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add unique constraint to fb_page_id, maybe duplicates exist';
        END;
    END IF;

END $$;

-- 4. Force a Schema Cache Refresh (Indirectly)
-- Sometimes adding a dummy comment or touching the table helps PostgREST.
COMMENT ON TABLE public.pages IS 'Table for storing Facebook Pages assigned to employees.';
