import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// If the env vars are missing the site still renders from the built-in defaults.
export const supabase = url && key ? createClient(url, key) : null;
export const BUCKET = 'portfolio';
