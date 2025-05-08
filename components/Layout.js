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

    // Remove player list cache
    localStorage.removeItem('cached_players');

    // Remove all cached PER entries
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('per:')) {
        localStorage.removeItem(key);
      }
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

      <header className="bg-gray-950 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-purple-400">NBA Picks</Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-4 text-sm">
            <Link href="/" className="hover:text-purple-300">Home</Link>
            {user ? (
              <>
                <Link href="/profile" className="hover:text-purple-300">Profile</Link>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-500">Logout</button>
              </>
            ) : (
              <Link href="/login" className="hover:text-purple-300">Login</Link>
            )}
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-purple-400 focus:outline-none"
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

        {/* Mobile Menu */}
        {menuOpen && (
          <div
            ref={menuRef}
            className="md:hidden fixed inset-0 z-40 bg-black/90 backdrop-blur-sm flex flex-col items-start p-6 space-y-4 text-sm animate-slide-down"
          >
            <Link href="/" onClick={() => setMenuOpen(false)} className="hover:text-purple-300">Home</Link>
            {user ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="hover:text-purple-300">Profile</Link>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-500">Logout</button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="hover:text-purple-300">Login</Link>
            )}
          </div>
        )}
      </header>

      <main className="bg-gray-900 min-h-screen text-white">{children}</main>
    </>
  );
}

