import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function Portfolio() {
  const [picks, setPicks] = useState([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPicks = async () => {
      const sessionRes = await supabase.auth.getSession();
      const user = sessionRes?.data?.session?.user;
      if (!user) return;

      setUserId(user.id);

      const { data: picksData, error } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const enriched = await Promise.all(picksData.map(async (pick) => {
        const res = await fetch(`https://www.balldontlie.io/api/v1/stats?player_ids[]=${pick.player_id}&per_page=100`);
        const json = await res.json();

        const stats = json.data;
        const perPoints = stats.map((g, i) => {
          const missedFG = g.fga - g.fgm;
          const missedFT = g.fta - g.ftm;
          return (g.pts + g.reb + g.ast + g.stl + g.blk - missedFG - missedFT - g.turnover).toFixed(2);
        });

        return {
          ...pick,
          perHistory: perPoints.reverse().slice(0, 10) // last 10 games
        };
      }));

      setPicks(enriched);
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

  const shareText = encodeURIComponent(`Check out my NBA player picks portfolio! 🏀 #InOrOut\n`);
  const shareUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/portfolio?id=${userId}`);

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold text-center mb-4">Your Portfolio</h1>

        {userId && (
          <div className="flex justify-center gap-4 mb-4">
            <a
              href={`https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md"
            >
              Share on X
            </a>
            <a
              href={`https://bsky.app/compose?text=${shareText + shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-md"
            >
              Share on BlueSky
            </a>
          </div>
        )}

        {loading ? (
          <p className="text-white">Loading...</p>
        ) : picks.length === 0 ? (
          <p className="text-gray-400 text-center">No picks found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {picks.map(pick => (
              <div key={pick.id} className="bg-gray-800 rounded-xl p-6 border border-purple-500/20 shadow-md space-y-4">
                <Link href={`/player/${pick.player_id}`} className="text-xl font-bold text-purple-300 hover:underline">
                  {pick.player_name}
                </Link>
                <p className="text-sm text-gray-400">Pick: <span className="text-white">{pick.selection.toUpperCase()}</span></p>
                <p className="text-purple-200">Locked PER: {pick.initial_per?.toFixed(2)}</p>
                {pick.career_per && (
                  <p>
                    Current PER: <span className="text-white">{pick.career_per.toFixed(2)}</span>{' '}
                    {renderTrend(pick.initial_per, pick.career_per)}
                  </p>
                )}
                {pick.perHistory?.length > 0 && (
                  <div>
                    <Line
                      options={{
                        responsive: true,
                        scales: {
                          y: { ticks: { color: '#ccc' }, grid: { color: '#444' } },
                          x: { ticks: { color: '#aaa' }, grid: { color: '#333' } }
                        },
                        plugins: {
                          legend: { display: false }
                        }
                      }}
                      data={{
                        labels: pick.perHistory.map((_, i) => `G${i + 1}`),
                        datasets: [
                          {
                            label: 'PER',
                            data: pick.perHistory,
                            borderColor: 'rgba(168, 85, 247, 0.9)',
                            backgroundColor: 'rgba(168, 85, 247, 0.3)',
                            fill: true,
                            tension: 0.3
                          }
                        ]
                      }}
                    />
                    <p className="text-sm text-gray-400 text-center mt-2">Last 10 Games PER</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
