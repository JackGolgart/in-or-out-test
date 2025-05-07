import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [player, setPlayer] = useState(null);
  const [userPick, setUserPick] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to make a pick.');
        setLoading(false);
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      const { data: playerData, error: playerErr } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .single();

      if (playerErr) {
        setError('Player not found.');
        setLoading(false);
        return;
      }

      setPlayer(playerData);

      const { data: pickData } = await supabase
        .from('user_picks')
        .select('*')
        .eq('player_id', id)
        .eq('user_id', uid)
        .maybeSingle();

      if (pickData) setUserPick(pickData);

      setLoading(false);
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!userId || !id) return;

    const subscription = supabase
      .channel('player-pick')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_picks',
          filter: `user_id=eq.${userId},player_id=eq.${id}`,
        },
        async () => {
          const { data } = await supabase
            .from('user_picks')
            .select('*')
            .eq('player_id', id)
            .eq('user_id', userId)
            .maybeSingle();

          if (data) setUserPick(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, id]);

  const handlePick = async (selection) => {
    setError('');
    const res = await fetch('/api/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: player.id,
        playerName: `${player.first_name} ${player.last_name}`,
        selection,
      }),
    });

    const result = await res.json();
    if (result.success) {
      setToast(`You selected ${selection.toUpperCase()}!`);
      setTimeout(() => setToast(''), 3000);
    } else {
      setError(result.error || 'Failed to save your pick.');
    }
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  const perChange = player && userPick
    ? (player.current_per - userPick.locked_in_per).toFixed(2)
    : null;

  const trend = perChange > 0
    ? { icon: '📈', color: 'text-green-400' }
    : perChange < 0
    ? { icon: '📉', color: 'text-red-400' }
    : { icon: '➖', color: 'text-gray-300' };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-8">
      {toast && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 px-4 py-2 rounded shadow-lg text-white transition-opacity duration-500">
          {toast}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-4">
        {player.first_name} {player.last_name}
      </h1>
      <p className="mb-2">Team: {player.team}</p>
      <p className="mb-2">Position: {player.position}</p>
      <p className="mb-6">Current PER: {player.current_per}</p>

      {userPick ? (
        <div className="bg-gray-800 p-4 rounded-md mt-4">
          <p className="text-green-400 font-semibold mb-2">
            You picked: {userPick.selection.toUpperCase()}
          </p>
          <p>PER at time of pick: {userPick.locked_in_per}</p>
          <p className={`${trend.color} flex items-center gap-2`}>
            {trend.icon} {perChange >= 0 ? '+' : ''}{perChange} PER since your pick
          </p>
        </div>
      ) : (
        <div className="space-x-4 mt-4">
          <button
            onClick={() => handlePick('in')}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md"
          >
            IN
          </button>
          <button
            onClick={() => handlePick('out')}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md"
          >
            OUT
          </button>
        </div>
      )}
    </div>
  );
}

