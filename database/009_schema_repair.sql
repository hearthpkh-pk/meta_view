-- ========================================================
-- 009: Database Schema Repair & Standardization (V3)
-- ========================================================

-- 1. Standards Check & Cleanup
DO $$ BEGIN
    -- If we have both, we need to merge or pick one. 
    -- For safety, if 'pages' exists, we'll keep it. If only 'account_pages' exists, we rename it.
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_pages' AND table_schema = 'public') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pages' AND table_schema = 'public') THEN
        ALTER TABLE public.account_pages RENAME TO pages;
    END IF;
END $$;

-- 2. Standardize 'pages' table structure
DO $$ 
DECLARE
    pk_name TEXT;
BEGIN
    -- A. Rename columns if they exist under old names
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='page_id' AND data_type='text')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='fb_page_id') THEN
        ALTER TABLE public.pages RENAME COLUMN page_id TO fb_page_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='page_id' AND data_type='uuid')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='id') THEN
        ALTER TABLE public.pages RENAME COLUMN page_id TO id;
    END IF;

    -- B. Ensure 'id' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='id') THEN
        ALTER TABLE public.pages ADD COLUMN id UUID DEFAULT gen_random_uuid();
    END IF;

    -- C. Standardize Primary Key (Using CASCADE to handle dependencies)
    SELECT constraint_name INTO pk_name
    FROM information_schema.table_constraints
    WHERE table_name = 'pages' AND constraint_type = 'PRIMARY KEY';

    IF pk_name IS NOT NULL THEN
        -- Check if it's already on 'id'
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.key_column_usage 
            WHERE table_name = 'pages' AND constraint_name = pk_name AND column_name = 'id'
        ) THEN
            -- Drop existing PK and all its dependencies (foreign keys)
            EXECUTE 'ALTER TABLE public.pages DROP CONSTRAINT ' || quote_ident(pk_name) || ' CASCADE';
            ALTER TABLE public.pages ADD PRIMARY KEY (id);
        END IF;
    ELSE
        -- No PK, add it
        ALTER TABLE public.pages ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 3. Re-establish Known Foreign Keys (Broken by CASCADE)
DO $$ BEGIN
    -- Re-link daily_stats
    ALTER TABLE public.daily_stats DROP CONSTRAINT IF EXISTS daily_stats_page_id_fkey;
    ALTER TABLE public.daily_stats ADD CONSTRAINT daily_stats_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;

    -- Re-link any other tables that might have been hit
    -- (Add others here if we find more dependencies)
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;


