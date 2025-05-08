import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function Layout({ children }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('cached_players');
    window.location.href = '/login';
  };

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
                <button onClick={handleLogout} className="text-red-400 hover:text-red-500">
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="hover:text-purple-300">Login</Link>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-purple-400 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
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

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-2 text-sm bg-gray-900">
            <Link href="/" className="hover:text-purple-300" onClick={() => setMenuOpen(false)}>Home</Link>
            {user ? (
              <>
                <Link href="/profile" className="hover:text-purple-300" onClick={() => setMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-500 text-left">
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="hover:text-purple-300" onClick={() => setMenuOpen(false)}>Login</Link>
            )}
          </div>
        )}
      </header>

      <main className="bg-gray-900 min-h-screen text-white">{children}</main>
    </>
  );
}

