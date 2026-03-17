import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants'

export function createClient() {
  if (!SUPABASE_URL) {
    console.warn('Supabase URL is missing. Client will not be initialized.');
    return null as any;
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export const supabase = typeof window !== 'undefined' ? createClient() : null as any;
