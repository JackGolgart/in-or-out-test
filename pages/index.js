import { useEffect, useState } from 'react';

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    async function getPlayers() {
      try {
        const res = await fetch('https://www.balldontlie.io/api/v1/players?per_page=100');
        if (!res.ok) throw new Error("Fetch failed with status " + res.status);
        const data = await res.json();
        setPlayers(data.data);
      } catch (err) {
        console.error("API fetch failed:", err);
      }
    }

    getPlayers();
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