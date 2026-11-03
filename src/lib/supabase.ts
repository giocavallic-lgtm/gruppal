import { createClient } from '@supabase/supabase-js';
import { hasSupabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export const supabase = hasSupabase
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;