import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Portfolio() {
  const [picks, setPicks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPicks = async () => {
      const sessionRes = await supabase.auth.getSession();
      const user = sessionRes?.data?.session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error(error);
      } else {
        const updated = await Promise.all(
          data.map(async (pick) => {
            const statsRes = await fetch(
              `https://www.balldontlie.io/api/v1/stats?player_ids[]=${pick.player_id}&seasons[]=2023&per_page=100`
            );
            const statsData = await statsRes.json();
            const games = statsData.data;

            let total = 0;
            games.forEach(game => {
              const missedFG = game.fga - game.fgm;
              const missedFT = game.fta - game.ftm;
              total += (game.pts + game.reb + game.ast + game.stl + game.blk - missedFG - missedFT - game.turnover);
            });
            const careerPER = games.length ? total / games.length : null;

            // Update if different
            if (careerPER && careerPER.toFixed(2) !== pick.career_per?.toFixed(2)) {
              await supabase
                .from('picks')
                .update({ career_per: careerPER })
                .eq('id', pick.id);
              return { ...pick, career_per: careerPER };
            }

            return pick;
          })
        );

        setPicks(updated);
      }

      setLoading(false);
    };

    fetchPicks();
  }, []);

  const renderTrend = (locked, current) => {
    const diff = current - locked;
    const icon = diff > 0 ? '📈' : diff < 0 ? '📉' : '➖';
    const color = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400';
    return <span className={`${color} font-bold`}>{icon} {diff.toFixed(2)}</span>;
  };

  const filtered = picks.filter(pick => {
    if (filter === 'all') return true;
    return pick.selection === filter;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Your Picks</h1>
          <div className="space-x-2">
            {['all', 'in', 'out'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded ${
                  filter === type ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-white">Loading picks...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-center">No picks to show.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((pick) => (
              <div key={pick.id} className="bg-gray-800 rounded-xl p-6 shadow-md border border-purple-500/20">
                <Link href={`/player/${pick.player_id}`} className="hover:underline text-xl font-semibold text-purple-300">
                  {pick.player_name}
                </Link>
                <p className="text-sm text-gray-400">You picked: <span className="text-white font-bold">{pick.selection.toUpperCase()}</span></p>
                <p className="mt-2 text-purple-200">Locked PER: {pick.initial_per?.toFixed(2)}</p>
                {pick.career_per !== null && (
                  <p className="mt-1">
                    Current PER: <span className="text-white">{pick.career_per.toFixed(2)}</span>
                    <span className="ml-2">{renderTrend(pick.initial_per, pick.career_per)}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
