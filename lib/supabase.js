// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Initialize Supabase client with error handling
let supabaseInstance = null;

try {
  supabaseInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  );

  // Test the connection
  supabaseInstance.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      // Clear any cached data
      localStorage.removeItem('cached_players');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('per:')) localStorage.removeItem(key);
      });
    }
  });
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  throw error;
}

export const supabase = supabaseInstance;