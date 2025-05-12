import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import api from '../../lib/bdlClient';
import Layout from '../../components/Layout';

export default function PlayerProfile({ player, stats, netRating }) {
  const router = useRouter();
  const [pick, setPick] = useState(null);
  const [trend, setTrend] = useState('');

  useEffect(() => {
    const fetchPick = async () => {
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user;
      if (!user || !netRating || !player?.id) return;

      const { data } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', user.id)
        .eq('player_id', player.id)
        .maybeSingle();

      if (data) {
        setPick(data);
        const delta = netRating - data.initial_net_rating;
        setTrend(delta > 0 ? '📈' : delta < 0 ? '📉' : '➖');
      }
    };

    fetchPick();
  }, [player?.id, netRating]);

  const handlePick = async (selection) => {
    const session = await supabase.auth.getSession();
    const user = session?.data?.session?.user;
    if (!user || !netRating) return;

    const { data, error } = await supabase.from('picks').upsert({
      user_id: user.id,
      player_id: player.id,
      player_name: `${player.first_name} ${player.last_name}`,
      selection,
      initial_net_rating: netRating,
    });

    if (!error) {
      setPick({ selection, initial_net_rating: netRating });
    }
  };

  if (router.isFallback) {
    return <Layout><div className="text-white p-6">Loading...</div></Layout>;
  }

  if (!player || !player.id) {
    return <Layout><div className="text-red-500 p-6">Player not found.</div></Layout>;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-wide">
              {player.first_name} {player.last_name}
            </h1>
            <p className="text-gray-400">{player.position} — {player.team?.full_name}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-purple-500/30 shadow-md">
              <h2 className="text-purple-300 text-lg font-semibold mb-2">NET Rating (Advanced Stats)</h2>
              <p className="text-5xl font-bold text-purple-100 animate-pulse">{netRating ?? 'N/A'}</p>
              {trend && (
                <p className="text-gray-300 mt-2">Trend since your pick: <span className="text-xl">{trend}</span></p>
              )}
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-cyan-500/30 shadow-md">
              <h2 className="text-cyan-300 text-lg font-semibold mb-2">Make Your Pick</h2>
              {pick ? (
                <p className="text-green-400 text-lg">You picked: {pick.selection.toUpperCase()}</p>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => handlePick('in')} className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700">
                    IN
                  </button>
                  <button onClick={() => handlePick('out')} className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700">
                    OUT
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-slate-600 mt-4">
            <h3 className="text-white text-lg font-bold mb-2">Season Averages (2023)</h3>
            {stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-300">
                <p><span className="text-white">PTS:</span> {stats.pts}</p>
                <p><span className="text-white">REB:</span> {stats.reb}</p>
                <p><span className="text-white">AST:</span> {stats.ast}</p>
                <p><span className="text-white">STL:</span> {stats.stl}</p>
                <p><span className="text-white">BLK:</span> {stats.blk}</p>
                <p><span className="text-white">TO:</span> {stats.turnover}</p>
              </div>
            ) : <p>No season stats found.</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { id } = params;

  try {
    const res = await fetch(`https://api.balldontlie.io/v2/players/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
      },
    });

    const player = await res.json();
    if (!player || !player.id) return { notFound: true };

    const advancedStatsRes = await fetch(`https://api.balldontlie.io/v1/stats/advanced?player_ids[]=${id}`);
    const advancedStats = await advancedStatsRes.json();

    let stats = null;
    let netRating = null;

    if (advancedStats.data.length > 0) {
      const recentStats = advancedStats.data[0];
      stats = recentStats;
      netRating = recentStats.net_rating;
    }

    return {
      props: {
        player,
        stats,
        netRating,
      },
      revalidate: 86400,
    };
  } catch (err) {
    console.error('Error fetching player:', err.message);
    return { notFound: true };
  }
}
