import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function PlayerDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [player, setPlayer] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUserId(session.user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchPlayer = async () => {
      try {
        const res = await fetch(`/api/player/${id}`);
        const data = await res.json();
        setPlayer(data);
      } catch (err) {
        console.error("Error loading player detail:", err);
      }
    };
    fetchPlayer();
  }, [id]);

  const makePick = async (selection) => {
    if (!userId || !player) {
      alert("Must be logged in.");
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
      alert(`Marked ${selection} on ${player.first_name} ${player.last_name}`);
    } catch (err) {
      console.error("Error saving pick:", err);
    }
  };

  if (!player) return <div style={{ padding: '2rem', color: 'white' }}>Loading player details...</div>;

  return (
    <div style={{ backgroundColor: '#0b0f1a', minHeight: '100vh', color: '#fff', padding: '2rem' }}>
      <img
        src={`https://cdn.nba.com/headshots/nba/latest/260x190/${player.id}.png`}
        alt="Player"
        onError={(e) => { e.target.style.display = 'none'; }}
        style={{ width: 120, borderRadius: 8, marginBottom: '1rem' }}
      />
      <h1>{player.first_name} {player.last_name}</h1>
      <p><strong>Position:</strong> {player.position || 'N/A'}</p>
      <p><strong>Team:</strong> {player.team?.full_name}</p>
      <p><strong>Abbreviation:</strong> {player.team?.abbreviation}</p>
      <p><strong>PER (mock):</strong> {Math.round(Math.random() * 15 + 10)}</p>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => makePick('IN')} style={{ marginRight: '1rem' }}>🔥 IN</button>
        <button onClick={() => makePick('OUT')}>❄️ OUT</button>
      </div>
      <button onClick={() => router.back()} style={{ marginTop: '2rem' }}>← Back</button>
    </div>
  );
}