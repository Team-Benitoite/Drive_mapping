import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const placeholderValues = new Set([
  '',
  'https://your-project-ref.supabase.co',
  'your-supabase-anon-key',
]);

export const storageBucket =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'route-photos';

export const profileIconBucket = 'profile-icons';

export const hasSupabaseEnv = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !placeholderValues.has(supabaseUrl) &&
    !placeholderValues.has(supabaseAnonKey),
);

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
