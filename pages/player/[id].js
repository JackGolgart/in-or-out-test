import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('../../components/PlayerChart'), { ssr: false });

export default function PlayerDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [player, setPlayer] = useState(null);
  const [pick, setPick] = useState(null);
  const [per, setPer] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPlayer = async () => {
      try {
        const res = await fetch(`/api/player/${id}`);
        const json = await res.json();
        setPlayer(json.player);

        const stats = json.seasonAverages;
        if (stats?.pts) {
          const calcPer = (
            stats.pts + stats.reb + stats.ast + stats.stl + stats.blk -
            (stats.fga - stats.fgm) -
            (stats.fta - stats.ftm) -
            stats.turnover
          ).toFixed(2);
          setPer(parseFloat(calcPer));
        }

        const session = await supabase.auth.getSession();
        const user = session?.data?.session?.user;
        if (user) {
          const { data } = await supabase
            .from('picks')
            .select('*')
            .eq('user_id', user.id)
            .eq('player_id', id)
            .maybeSingle();

          if (data) setPick(data);
        }

        // Chart Data
        const chartRes = await fetch(`/api/player/${id}/history`);
        const chartJson = await chartRes.json();
        setChartData(chartJson);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id]);

  const handlePick = async (selection) => {
    const session = await supabase.auth.getSession();
    const user = session?.data?.session?.user;
    if (!user || !per) return;

    const { data, error } = await supabase.from('picks').upsert({
      user_id: user.id,
      player_id: parseInt(id),
      player_name: `${player.first_name} ${player.last_name}`,
      selection,
      initial_per: per,
    });

    if (!error) setPick({ selection, initial_per: per });
  };

  if (loading) return <div className="p-6 text-white">Loading player...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        {player.first_name} {player.last_name}
      </h1>
      <p className="text-gray-400 mb-4">
        {player.position} — {player.team?.full_name}
      </p>

      <div className="mb-6">
        <p className="text-lg">Current PER: <span className="text-purple-300">{per ?? 'N/A'}</span></p>
        {!pick ? (
          <div className="mt-2 flex gap-4">
            <button onClick={() => handlePick('in')} className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">IN</button>
            <button onClick={() => handlePick('out')} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">OUT</button>
          </div>
        ) : (
          <p className="text-green-400 mt-2">You picked: {pick.selection.toUpperCase()} (PER: {pick.initial_per})</p>
        )}
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Season Performance</h2>
        <Chart data={chartData} />
      </div>
    </div>
  );
}

