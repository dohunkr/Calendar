import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Anon Key from environment variables or localStorage fallback
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, isDynamic: false };
  }

  // Fallback to localStorage (especially useful for local Electron builds)
  const localUrl = localStorage.getItem('dohun_supabase_url');
  const localKey = localStorage.getItem('dohun_supabase_anon_key');

  if (localUrl && localKey) {
    return { url: localUrl, key: localKey, isDynamic: true };
  }

  return null;
};

const config = getSupabaseConfig();

export const isSupabaseConfigured = !!config;
export const isSupabaseDynamic = config?.isDynamic || false;

export const supabase = isSupabaseConfigured
  ? createClient(config!.url, config!.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : (null as any);

// Functions to manage dynamic runtime configuration
export const saveRuntimeSupabaseConfig = (url: string, key: string) => {
  if (!url || !key) return false;
  localStorage.setItem('dohun_supabase_url', url.trim());
  localStorage.setItem('dohun_supabase_anon_key', key.trim());
  return true;
};

export const clearRuntimeSupabaseConfig = () => {
  localStorage.removeItem('dohun_supabase_url');
  localStorage.removeItem('dohun_supabase_anon_key');
};
