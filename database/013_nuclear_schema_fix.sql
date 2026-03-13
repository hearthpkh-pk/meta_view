-- ========================================================
-- 013: Nuclear Schema Reconciliation - Pages Table
-- (Fixes: Persistent NOT NULL constraint issues on legacy columns)
-- ========================================================

DO $$ 
DECLARE
    pk_name TEXT;
BEGIN
    -- 1. IDENTIFY & FIX PRIMARY KEY
    -- We want 'id' (UUID) to be the ONLY primary key.
    
    SELECT constraint_name INTO pk_name
    FROM information_schema.table_constraints
    WHERE table_name = 'pages' AND constraint_type = 'PRIMARY KEY' AND table_schema = 'public';

    IF pk_name IS NOT NULL THEN
        -- Check if current PK is NOT 'id'
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.key_column_usage 
            WHERE table_name = 'pages' AND constraint_name = pk_name AND column_name = 'id'
        ) THEN
            -- Nuclear drop PK (CASCADE to handle deps)
            EXECUTE 'ALTER TABLE public.pages DROP CONSTRAINT ' || quote_ident(pk_name) || ' CASCADE';
            
            -- Ensure 'id' exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='id') THEN
                ALTER TABLE public.pages ADD COLUMN id UUID DEFAULT gen_random_uuid();
            END IF;
            
            ALTER TABLE public.pages ADD PRIMARY KEY (id);
        END IF;
    ELSE
        -- No PK at all
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='id') THEN
            ALTER TABLE public.pages ADD COLUMN id UUID DEFAULT gen_random_uuid();
        END IF;
        ALTER TABLE public.pages ADD PRIMARY KEY (id);
    END IF;

    -- 2. RESOLVE 'fb_page_id' vs 'page_id' (TEXT)
    -- We want 'fb_page_id' for the FB ID String.
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='page_id' AND data_type='text') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='fb_page_id') THEN
            ALTER TABLE public.pages RENAME COLUMN page_id TO fb_page_id;
        ELSE
            -- Both exist. 'page_id' is redundant and likely the source of the error.
            -- Drop NOT NULL from 'page_id' so it doesn't block inserts.
            ALTER TABLE public.pages ALTER COLUMN page_id DROP NOT NULL;
            -- Optionally drop it if you are brave:
            -- ALTER TABLE public.pages DROP COLUMN page_id;
        END IF;
    END IF;

    -- 3. FIX ANY OTHER NOT NULL CONSTRAINTS ON GHOST COLUMNS
    -- Iterate and drop NOT NULL for any column that isn't in our current known spec.
    -- (Safety measure for dirty schemas)
    
    -- Drop NOT NULL on 'page_id' if it's UUID but not the PK
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='page_id' AND data_type='uuid') THEN
        ALTER TABLE public.pages ALTER COLUMN page_id DROP NOT NULL;
    END IF;

    -- 4. FINAL TOUCH: Ensure fb_page_id is ready
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='fb_page_id') THEN
        ALTER TABLE public.pages ADD COLUMN fb_page_id TEXT;
    END IF;

END $$;

-- 5. Add index and comment (Standard SQL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_fb_page_id ON public.pages(fb_page_id);

COMMENT ON TABLE public.pages IS 'Standardized table for Meta HR Pages with UUID id as PK and fb_page_id as metadata.';
