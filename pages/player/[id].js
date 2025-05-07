import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;

  const [player, setPlayer] = useState(null);
  const [per, setPer] = useState(null);
  const [pick, setPick] = useState(null);
  const [trend, setTrend] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPlayer = async () => {
      try {
        const res = await fetch(`/api/player/${id}`);
        const json = await res.json();
        setPlayer(json.player);
        setPer(json.seasonAverages?.per || null);

        const sessionRes = await supabase.auth.getSession();
        const user = sessionRes?.data?.session?.user;

        if (user) {
          const { data } = await supabase
            .from('picks')
            .select('*')
            .eq('user_id', user.id)
            .eq('player_id', id)
            .maybeSingle();

          if (data) {
            setPick(data);
            if (json.seasonAverages?.per && data.initial_per) {
              const delta = json.seasonAverages.per - data.initial_per;
              setTrend(delta > 0 ? '📈' : delta < 0 ? '📉' : '➖');
            }
          }
        }

      } catch (err) {
        console.error('Player fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id]);

  const handlePick = async (choice) => {
    const sessionRes = await supabase.auth.getSession();
    const user = sessionRes?.data?.session?.user;
    if (!user || !per) return;

    const { data, error } = await supabase.from('picks').upsert({
      user_id: user.id,
      player_id: parseInt(id),
      player_name: `${player.first_name} ${player.last_name}`,
      selection: choice,
      initial_per: per,
    });

    if (!error) {
      setPick({ ...data, selection: choice, initial_per: per });
    }
  };

  if (loading) return <div className="text-white p-8">Loading player data...</div>;
  if (!player) return <div className="text-red-500 p-8">Player not found.</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{player.first_name} {player.last_name}</h1>
          <p className="text-gray-400">{player.position} — {player.team.full_name}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-md border border-purple-500/40">
          <h2 className="text-xl font-semibold mb-2 text-purple-300">PER (2023 Season)</h2>
          <p className="text-5xl font-bold text-purple-200 animate-pulse">
            {per ? per.toFixed(2) : 'N/A'}
          </p>
          {trend && (
            <p className="text-sm text-gray-400 mt-2">
              Compared to your pick: <span className="text-xl">{trend}</span>
            </p>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-cyan-500/40">
          <h3 className="text-cyan-300 text-lg font-semibold mb-2">Your Pick</h3>
          {pick ? (
            <p className="text-green-400">You picked: {pick.selection.toUpperCase()}</p>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={() => handlePick('in')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md"
              >
                IN
              </button>
              <button
                onClick={() => handlePick('out')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md"
              >
                OUT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
