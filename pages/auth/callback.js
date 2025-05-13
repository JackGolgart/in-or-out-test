'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session and check for errors
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          console.error('No session found after authentication');
          throw new Error('Authentication failed - no session');
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore "not found" error
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }

        // Create profile if it doesn't exist
        if (!profile) {
          const { error: createError } = await supabase
            .from('users')
            .insert([{
              id: session.user.id,
              email: session.user.email,
              username: session.user.email.split('@')[0]
            }]);

          if (createError) {
            console.error('Profile creation error:', createError);
            throw createError;
          }
        }

        // Redirect to home page on success
        router.push('/');
      } catch (error) {
        console.error('Auth callback error:', error);
        // Redirect to login with specific error message
        const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
        router.push(`/login?error=${errorMessage}`);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-400">Completing authentication...</p>
    </div>
  );
} 