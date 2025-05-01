import { useEffect, useState } from 'react';
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
    const fetchPlayers = async () => {
      try {
        const res = await fetch("https://www.balldontlie.io/api/v1/players?per_page=100");
        const data = await res.json();
        console.log("Loaded players via fetch:", data.data);
        setPlayers(data.data);
      } catch (err) {
        console.error("Direct fetch failed:", err);
      }
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    setFiltered(players.filter(p =>
      (p.first_name + ' ' + p.last_name).toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, players]);

  const makePick = async (player, selection) => {
    if (!userId) {
      alert("You must be logged in to make picks.");
      return;
    }

    try {
      const per = Math.random() * 25 + 5;
      const { error } = await supabase.from('picks').insert([
        {
          user_id: userId,
          player_id: player.id,
          player_name: player.first_name + ' ' + player.last_name,
          selection,
          initial_per: per,
          career_per: per - Math.random() * 3
        }
      ]);
      if (error) throw error;
      alert(`You are now ${selection} on ${player.first_name} ${player.last_name}`);
    } catch (err) {
      console.error("Failed to save pick:", err);
    }
  };

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
      <ul style={{ marginTop: '2rem' }}>
        {filtered.map(player => (
          <li key={player.id} style={{ marginBottom: '1rem' }}>
            <span style={{ marginRight: '1rem', fontWeight: 'bold' }}>
              #{player.id} - {player.first_name} {player.last_name}
            </span>
            <button onClick={() => makePick(player, 'IN')} style={{ marginRight: '0.5rem' }}>🔥 IN</button>
            <button onClick={() => makePick(player, 'OUT')}>❄️ OUT</button>
          </li>
        ))}
      </ul>
    </div>
  );
}