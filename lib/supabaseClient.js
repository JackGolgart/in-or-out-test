import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          storageKey: 'supabase.auth.token',
          storage: {
            getItem: (key) => {
              if (typeof window === 'undefined') return null;
              const value = window.localStorage.getItem(key);
              return value ? JSON.parse(value) : null;
            },
            setItem: (key, value) => {
              if (typeof window === 'undefined') return;
              window.localStorage.setItem(key, JSON.stringify(value));
            },
            removeItem: (key) => {
              if (typeof window === 'undefined') return;
              window.localStorage.removeItem(key);
            },
          },
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          // Set session duration to 48 hours (in seconds)
          sessionDuration: 48 * 60 * 60,
          // Enable debug mode in development
          debug: process.env.NODE_ENV === 'development',
        },
        global: {
          headers: {
            'x-application-name': 'in-or-out',
          },
        },
      }
    );
  }
  return supabaseInstance;
}

let supabaseAdminInstance = null;

export function getSupabaseAdminClient() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: true,
          storageKey: 'supabase.auth.token',
          storage: {
            getItem: (key) => {
              if (typeof window === 'undefined') return null;
              const value = window.localStorage.getItem(key);
              return value ? JSON.parse(value) : null;
            },
            setItem: (key, value) => {
              if (typeof window === 'undefined') return;
              window.localStorage.setItem(key, JSON.stringify(value));
            },
            removeItem: (key) => {
              if (typeof window === 'undefined') return;
              window.localStorage.removeItem(key);
            },
          },
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          // Set session duration to 48 hours (in seconds)
          sessionDuration: 48 * 60 * 60,
          // Enable debug mode in development
          debug: process.env.NODE_ENV === 'development',
        },
        global: {
          headers: {
            'x-application-name': 'in-or-out',
          },
        },
      }
    );
  }
  return supabaseAdminInstance;
} 