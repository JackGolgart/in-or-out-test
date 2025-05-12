import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function Layout({ children }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('cached_players');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('per:')) localStorage.removeItem(key);
    });
    window.location.href = '/login';
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

  return (
    <>
      <Head>
        <title>NBA Picks</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/basketball.svg" type="image/svg+xml" />
      </Head>

      <header className="bg-gradient-to-r from-gray-950 to-gray-900 text-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 transition duration-300">
              NBA Picks
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium">Home</Link>
              <Link href="/portfolio" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium">Portfolio</Link>
              {user ? (
                <>
                  <Link href="/profile" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium">Profile</Link>
                  <button 
                    onClick={handleLogout} 
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors duration-200 text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors duration-200 text-sm font-medium"
                >
                  Login
                </Link>
              )}
            </nav>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition duration-200"
              aria-label="Toggle menu"
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
            <div className="flex flex-col items-center justify-center h-full space-y-8 text-lg">
              <Link 
                href="/" 
                onClick={() => setMenuOpen(false)} 
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Home
              </Link>
              <Link 
                href="/portfolio" 
                onClick={() => setMenuOpen(false)} 
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Portfolio
              </Link>
              {user ? (
                <>
                  <Link 
                    href="/profile" 
                    onClick={() => setMenuOpen(false)} 
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  onClick={() => setMenuOpen(false)} 
                  className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors duration-200"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </>
  );
}
