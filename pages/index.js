import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchPortfolio = async () => {
      const { data, error } = await supabase
        .from('user_picks')
        .select('player_id, player_name, selection, locked_in_per')
        .eq('user_id', userId);
      if (!error) setPortfolio(data);
    };

    fetchPortfolio();

    const subscription = supabase
      .channel('portfolio')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_picks',
          filter: `user_id=eq.${userId}`,
        },
        () => fetchPortfolio()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/players?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      setPlayers(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to fetch players.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">In or Out?</h1>

      {userId && <p className="mb-6">Welcome back, user {userId}</p>}

      <div className="flex items-center mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search NBA player..."
          className="px-4 py-2 text-black rounded-md w-80"
        />
        <button
          onClick={handleSearch}
          className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Search
        </button>
      </div>

      {loading && <p className="mb-4">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Search Results</h2>
        {players.length === 0 ? (
          <p>No players found.</p>
        ) : (
          <ul className="space-y-2">
            {players.map(player => (
              <li key={player.id}>
                <Link href={`/player/${player.id}`} className="text-blue-400 hover:underline">
                  {player.first_name} {player.last_name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Your Portfolio</h2>
        <ul className="space-y-2">
          {portfolio.length === 0 ? (
            <li>You haven’t selected any players yet.</li>
          ) : (
            portfolio.map(item => (
              <li key={item.player_id} className="bg-gray-800 p-4 rounded-md">
                <p className="font-semibold">{item.player_name}</p>
                <p>Selection: <span className="uppercase">{item.selection}</span></p>
                <p>Locked-in PER: {item.locked_in_per}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
