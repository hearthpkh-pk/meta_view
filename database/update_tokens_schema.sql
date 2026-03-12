-- run this in Supabase SQL editor
-- Add added_by column to track who added the token (to avoid confusion)
ALTER TABLE public.tokens 
ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES auth.users(id);

-- Make added_by nullable initially in case existing rows don't have it,
-- but tracking is enabled going forward.

COMMENT ON COLUMN public.tokens.added_by IS 'Tracks the employee who contributed this Facebook token to the shared pool.';
