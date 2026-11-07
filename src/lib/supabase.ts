import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export type AppSupabaseClient = SupabaseClient<Database>;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const placeholderValues = new Set([
  '',
  'https://your-project-ref.supabase.co',
  'your-supabase-anon-key',
]);

export const storageBucket: string =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'route-photos';

export const profileIconBucket = 'profile-icons';

const googleMapsEmbedApiKey =
  import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY || '';
const googleMapsPlaceholderValues = new Set([
  '',
  'your-google-maps-embed-api-key',
]);

export const googleMapsApiKey: string = googleMapsPlaceholderValues.has(
  googleMapsEmbedApiKey,
)
  ? ''
  : googleMapsEmbedApiKey;

export const hasSupabaseEnv = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !placeholderValues.has(supabaseUrl) &&
    !placeholderValues.has(supabaseAnonKey),
);

export const supabase: AppSupabaseClient | null =
  hasSupabaseEnv && supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;
