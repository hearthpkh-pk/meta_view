-- RUN THIS SCRIPT FIRST TO DELETE OLD POLICIES

-- Drop old recursive policies
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Super Admins can manage employees" ON public.employees;

-- Drop old helper if exists (the one with UUID param)
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
