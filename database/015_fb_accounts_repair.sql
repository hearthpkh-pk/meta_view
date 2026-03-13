-- ========================================================
-- 015: FB Accounts Schema Repair & Standardization
-- Resolves: "Could not find the 'name' column of 'fb_accounts'"
-- ========================================================

-- 1. Ensure 'name' column exists and is searchable
DO $$ BEGIN
    -- If 'full_name' exists but 'name' doesn't, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='full_name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='name') THEN
        ALTER TABLE public.fb_accounts RENAME COLUMN full_name TO name;
    END IF;

    -- If 'name' still doesn't exist, add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='name') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN name TEXT;
    END IF;

    -- Aggressive: Drop NOT NULL if it's blocking (standardize after data is in)
    ALTER TABLE public.fb_accounts ALTER COLUMN name DROP NOT NULL;
    ALTER TABLE public.fb_accounts ALTER COLUMN uid DROP NOT NULL;
END $$;

-- 2. Standardize other key columns for fb_accounts
DO $$ BEGIN
    -- username (formerly mail in older versions maybe)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='mail')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='username') THEN
        ALTER TABLE public.fb_accounts RENAME COLUMN mail TO username;
    END IF;

    -- Ensure key management columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='assigned_to') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN assigned_to UUID REFERENCES public.employees(id);
    END IF;
    
    -- Ensure pages_managed exists (Array of UUIDs for relationships)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='pages_managed') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN pages_managed UUID[] DEFAULT '{}';
    END IF;
END $$;

-- 3. FORCE SCHEMA CACHE REFRESH
-- We do this by touching the table comment or performing a no-op alter
COMMENT ON TABLE public.fb_accounts IS 'Facebook accounts for management - Schema Updated';

-- 4. Verify RLS
ALTER TABLE public.fb_accounts ENABLE ROW LEVEL SECURITY;
