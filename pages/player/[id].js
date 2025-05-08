import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import api from '../../lib/bdlClient';
import Layout from '../../components/Layout';

export default function PlayerProfile({ player, stats, per }) {
  const router = useRouter();
  const [pick, setPick] = useState(null);
  const [trend, setTrend] = useState('');

  useEffect(() => {
    const fetchPick = async () => {
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user;
      if (!user || !per || !player?.id) return;

      const { data } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', user.id)
        .eq('player_id', player.id)
        .maybeSingle();

      if (data) {
        setPick(data);
        const delta = per - data.initial_per;
        setTrend(delta > 0 ? '📈' : delta < 0 ? '📉' : '➖');
      }
    };

    fetchPick();
  }, [player?.id, per]);

  const handlePick = async (selection) => {
    const session = await supabase.auth.getSession();
    const user = session?.data?.session?.user;
    if (!user || !per) return;

    const { data, error } = await supabase.from('picks').upsert({
      user_id: user.id,
      player_id: player.id,
      player_name: `${player.first_name} ${player.last_name}`,
      selection,
      initial_per: per,
    });

    if (!error) {
      setPick({ selection, initial_per: per });
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
              <h2 className="text-purple-300 text-lg font-semibold mb-2">Calculated PER (Season)</h2>
              <p className="text-5xl font-bold text-purple-100 animate-pulse">{per ?? 'N/A'}</p>
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
    const res = await fetch(`https://api.balldontlie.io/v1/players/${id}`, {
      headers: {
        Authorization: 'Bearer YOUR_API_KEY',
      },
    });

    const player = await res.json();
    if (!player || !player.id) return { notFound: true };

    const averages = await api.nba.getSeasonAverages({
      player_ids: [parseInt(id)],
      season: 2023,
    });

    let stats = null;
    let per = null;

    if (averages.data.length > 0) {
      stats = averages.data[0];
      per = parseFloat((
        stats.pts + stats.reb + stats.ast + stats.stl + stats.blk -
        (stats.fga - stats.fgm) -
        (stats.fta - stats.ftm) -
        stats.turnover
      ).toFixed(2));
    }

    return {
      props: {
        player,
        stats,
        per,
      },
      revalidate: 86400,
    };
  } catch (err) {
    console.error('Error fetching player:', err.message);
    return { notFound: true };
  }
}

