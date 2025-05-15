import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import LoadingSpinner from './LoadingSpinner';

export default function Layout({ children }) {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef();
  const router = useRouter();

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('cached_players');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('per:')) localStorage.removeItem(key);
      });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Show loading state only after component is mounted
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <Head>
        <title>In-or-Out</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Track NBA player performance and make predictions" />
        <meta name="theme-color" content="#1f2937" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </Head>

      <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-white hover:text-purple-400 transition-colors duration-300">
              <img src="/logos/in-or-out-logo.png" alt="In-or-Out Logo" className="h-8 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200 text-sm font-medium"
              >
                Home
              </Link>
              <Link 
                href="/portfolio" 
                className="text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200 text-sm font-medium"
              >
                Portfolio
              </Link>
              {user ? (
                <>
                  <Link 
                    href="/profile" 
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200 text-sm font-medium"
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="btn-primary bg-red-500/90 hover:bg-red-500"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="btn-primary"
                >
                  Login
                </Link>
              )}
            </nav>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 transition duration-200"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div
            ref={menuRef}
            className="md:hidden fixed inset-0 z-40 bg-gray-900/95 backdrop-blur-md"
          >
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <Link 
                href="/" 
                onClick={() => setMenuOpen(false)} 
                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200"
              >
                Home
              </Link>
              <Link 
                href="/portfolio" 
                onClick={() => setMenuOpen(false)} 
                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200"
              >
                Portfolio
              </Link>
              {user ? (
                <>
                  <Link 
                    href="/profile" 
                    onClick={() => setMenuOpen(false)} 
                    className="text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="btn-primary bg-red-500/90 hover:bg-red-500"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  onClick={() => setMenuOpen(false)} 
                  className="btn-primary"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {children}
      </main>
    </div>
  );
}
