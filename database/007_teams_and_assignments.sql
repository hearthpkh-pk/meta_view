-- ==========================================
-- 007: Teams and Hierarchical Assignments
-- ==========================================
-- This script adds team structures to support hierarchical access.

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add team_id to employees
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='team_id') THEN
        ALTER TABLE public.employees ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Add team_id to fb_accounts (For easier team-based filtering)
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_accounts' AND column_name='team_id') THEN
        ALTER TABLE public.fb_accounts ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Enable RLS for Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 5. Teams Policies
DROP POLICY IF EXISTS "Everyone can view teams" ON public.teams;
CREATE POLICY "Everyone can view teams" ON public.teams
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins manage teams" ON public.teams;
CREATE POLICY "Only admins manage teams" ON public.teams
    FOR ALL USING (public.user_has_permission('manage_employees'));

-- 6. Update Triggers
DROP TRIGGER IF EXISTS teams_updated_at ON public.teams;
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Update fb_accounts RLS to favor Team/Hierarchy
-- This will be applied via a refresh of 004_security_rls or a dedicated patch.

-- [Optional] Add default team if needed
-- INSERT INTO public.teams (name) VALUES ('General') ON CONFLICT DO NOTHING;
