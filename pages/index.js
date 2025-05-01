import { useEffect, useState } from 'react';
import { BalldontlieAPI } from '@balldontlie/sdk';

const api = new BalldontlieAPI({
  apiKey: 'c81d57c3-85f8-40f2-ad5b-0c268c0220a0'
});

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await api.players.getAll({ perPage: 100 });
        setPlayers(response.data);
      } catch (err) {
        console.error("SDK fetch failed:", err);
      }
    }
    fetchPlayers();
  }, []);

  useEffect(() => {
    setFiltered(players.filter(p =>
      (p.first_name + ' ' + p.last_name).toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, players]);

  return (
    <div style={{ backgroundColor: '#0b0f1a', minHeight: '100vh', color: '#fff', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem' }}>In or Out?</h1>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search NBA player..."
        style={{ padding: '0.5rem', fontSize: '1rem', width: '300px', marginRight: '1rem' }}
      />
      <button onClick={() => {}} style={{ padding: '0.5rem 1rem' }}>Search</button>
      <ul style={{ marginTop: '2rem' }}>
        {filtered.map(player => (
          <li key={player.id} style={{ marginBottom: '1rem' }}>
            <span style={{ marginRight: '1rem', fontWeight: 'bold' }}>
              #{player.id} - {player.first_name} {player.last_name}
            </span>
            <button style={{ marginRight: '0.5rem' }}>🔥 IN</button>
            <button>❄️ OUT</button>
          </li>
        ))}
      </ul>
    </div>
  );
}