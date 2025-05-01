import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUserId(session.user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/players");
      const json = await res.json();
      const all = Array.isArray(json.data) ? json.data : [];
      setPlayers(all);
      setFiltered(all);
    } catch (err) {
      console.error("Failed to fetch players via proxy:", err);
    }
  };

  const handleSearch = () => {
    const result = players.filter(p =>
      (p.first_name + ' ' + p.last_name).toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  };

  return (
    <div style={{ backgroundColor: '#0b0f1a', minHeight: '100vh', color: '#fff', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem' }}>In or Out?</h1>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search NBA player..."
        style={{ padding: '0.5rem', fontSize: '1rem', width: '300px' }}
      />
      <button onClick={handleSearch} style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>Search</button>

      <div style={{ marginTop: '2rem' }}>
        {filtered.length === 0 ? (
          <p>No players found.</p>
        ) : (
          <ul>
            {filtered.map(player => (
              <li key={player.id} style={{ marginBottom: '1rem' }}>
                <Link href={`/player/${player.id}`} style={{ color: '#6cf', marginRight: '1rem' }}>
                  {player.first_name} {player.last_name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}