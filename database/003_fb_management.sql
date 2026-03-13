-- 1. FB Accounts (Enhanced for Management)
CREATE TABLE IF NOT EXISTS public.fb_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    
    -- Credentials & 2FA (Placeholders for encrypted data)
    username TEXT,
    password_hint TEXT,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_pin TEXT,
    
    -- Status & Details
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned')),
    account_type TEXT DEFAULT 'personal', -- personal, business, creator
    note TEXT,
    
    -- Assignment
    assigned_to UUID REFERENCES public.employees(id),
    managed_by UUID REFERENCES public.employees(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure enhanced columns exist for fb_accounts
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='status') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='account_type') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN account_type TEXT DEFAULT 'personal';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='assigned_to') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN assigned_to UUID REFERENCES public.employees(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='managed_by') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN managed_by UUID REFERENCES public.employees(id);
    END IF;
END $$;

-- 2. FB Tokens
CREATE TABLE IF NOT EXISTS public.tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES public.fb_accounts(id) ON DELETE CASCADE,
    token_value TEXT NOT NULL,
    token_type TEXT DEFAULT 'access_token',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure account_id exists in tokens (if table was created previously)
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tokens' AND column_name='account_id') THEN
        ALTER TABLE public.tokens ADD COLUMN account_id UUID REFERENCES public.fb_accounts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. FB Pages (Enhanced for Analytics)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fb_page_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.page_categories(id),
    account_id UUID REFERENCES public.fb_accounts(id) ON DELETE CASCADE,
    
    -- Stats & Metadata
    likes_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    last_sync_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure enhanced columns exist for pages
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='likes_count') THEN
        ALTER TABLE public.pages ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='followers_count') THEN
        ALTER TABLE public.pages ADD COLUMN followers_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='status') THEN
        ALTER TABLE public.pages ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='last_sync_at') THEN
        ALTER TABLE public.pages ADD COLUMN last_sync_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='account_id') THEN
        ALTER TABLE public.pages ADD COLUMN account_id UUID REFERENCES public.fb_accounts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Employee FB Access (Junction for permissions)
CREATE TABLE IF NOT EXISTS public.employee_fb_access (
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    fb_account_id UUID REFERENCES public.fb_accounts(id) ON DELETE CASCADE,
    PRIMARY KEY (employee_id, fb_account_id)
);

-- 5. Enable RLS
ALTER TABLE public.fb_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_fb_access ENABLE ROW LEVEL SECURITY;

-- 6. updated_at Triggers
DROP TRIGGER IF EXISTS fb_accounts_updated_at ON public.fb_accounts;
CREATE TRIGGER fb_accounts_updated_at BEFORE UPDATE ON public.fb_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS tokens_updated_at ON public.tokens;
CREATE TRIGGER tokens_updated_at BEFORE UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION set_updated_at();
