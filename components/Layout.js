import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function Layout({ children }) {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      <header className="bg-gray-950 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <span className="text-xl font-bold text-purple-400 cursor-pointer">NBA Picks</span>
          </Link>

          <nav className="flex gap-4 text-sm">
            <Link href="/">
              <span className="hover:text-purple-300 cursor-pointer">Home</span>
            </Link>
            {user ? (
              <>
                <Link href="/profile">
                  <span className="hover:text-purple-300 cursor-pointer">Profile</span>
                </Link>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-500">
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login">
                <span className="hover:text-purple-300 cursor-pointer">Login</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="bg-gray-900 min-h-screen text-white">{children}</main>
    </>
  );
}
