import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // adjust if you import differently

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;

  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState([]);
  const [per, setPer] = useState(null);
  const [userPick, setUserPick] = useState(null);
  const [trend, setTrend] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const playerRes = await fetch(`https://www.balldontlie.io/api/v1/players/${id}`);
        const playerData = await playerRes.json();
        setPlayer(playerData);

        const statsRes = await fetch(`https://www.balldontlie.io/api/v1/stats?player_ids[]=${id}&seasons[]=2023&per_page=100`);
        const statsData = await statsRes.json();
        setStats(statsData.data);

        // Calculate PER
        let total = 0;
        statsData.data.forEach(game => {
          const missedFG = game.fga - game.fgm;
          const missedFT = game.fta - game.ftm;
          const per = (game.pts + game.reb + game.ast + game.stl + game.blk - missedFG - missedFT - game.turnover);
          total += per;
        });
        const avgPER = total / statsData.data.length;
        setPer(avgPER.toFixed(2));

        // Trend: recent 5 games
        const last5 = statsData.data.slice(0, 5);
        let trendTotal = 0;
        last5.forEach(game => {
          const missedFG = game.fga - game.fgm;
          const missedFT = game.fta - game.ftm;
          const per = (game.pts + game.reb + game.ast + game.stl + game.blk - missedFG - missedFT - game.turnover);
          trendTotal += per;
        });
        const trendPER = trendTotal / last5.length;
        setTrend(trendPER > avgPER ? '📈' : trendPER < avgPER ? '📉' : '➖');

        // Check user pick
        const session = await supabase.auth.getSession();
        if (session?.data?.session) {
          const { data: pickData } = await supabase
            .from('picks')
            .select('*')
            .eq('user_id', session.data.session.user.id)
            .eq('player_id', id)
            .maybeSingle();
          if (pickData) setUserPick(pickData.selection);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePick = async (choice) => {
    const session = await supabase.auth.getSession();
    const userId = session?.data?.session?.user?.id;
    if (!userId) return;

    await supabase.from('picks').upsert({
      user_id: userId,
      player_id: parseInt(id),
      player_name: `${player.first_name} ${player.last_name}`,
      selection: choice,
      initial_per: parseFloat(per),
      career_per: null, // Optional
    });

    setUserPick(choice);
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{player.first_name} {player.last_name}</h1>
          <p className="text-gray-400">{player.position} — {player.team.full_name}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-md border border-purple-500/40">
          <h2 className="text-xl font-semibold mb-2 text-purple-300">PER (2023 Season)</h2>
          <p className="text-5xl font-bold text-purple-200 animate-pulse">{per}</p>
          <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
            Trend vs recent: <span className="text-xl">{trend}</span>
          </p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-cyan-500/40">
          <h3 className="text-cyan-300 text-lg font-semibold mb-2">Make Your Pick</h3>
          {userPick ? (
            <p className="text-green-400">You picked: {userPick.toUpperCase()}</p>
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
