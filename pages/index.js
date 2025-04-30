import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetch('https://www.balldontlie.io/api/v1/players?per_page=100')
      .then(res => res.json())
      .then(data => setPlayers(data.data));
  }, []);

  useEffect(() => {
    setFiltered(players.filter(p =>
      (p.first_name + ' ' + p.last_name).toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, players]);

  async function makePick(player, selection) {
    if (!userId) {
      alert("You must be logged in to make a pick.");
      return;
    }

    const { error } = await supabase.from('picks').insert([
      {
        user_id: userId,
        player_id: player.id,
        player_name: player.first_name + ' ' + player.last_name,
        selection: selection
      }
    ]);

    if (error) {
      console.error("Failed to save pick:", error);
      alert("Error saving pick.");
    } else {
      alert(`You are now ${selection} on ${player.first_name} ${player.last_name}`);
    }
  }

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
            <button style={{ marginRight: '0.5rem' }} onClick={() => makePick(player, 'IN')}>🔥 IN</button>
            <button onClick={() => makePick(player, 'OUT')}>❄️ OUT</button>
          </li>
        ))}
      </ul>
    </div>
  );
}