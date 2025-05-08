import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

const LineChart = dynamic(() => import('../components/PerTrendChart'), { ssr: false });

export default function Portfolio() {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, in: 0, out: 0 });
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  useEffect(() => {
    const fetchPicks = async () => {
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPicks(data);

        const totals = {
          total: data.length,
          in: data.filter(p => p.selection === 'in').length,
          out: data.filter(p => p.selection === 'out').length,
        };
        setSummary(totals);
      }

      setLoading(false);
    };

    fetchPicks();
  }, []);

  const uniquePlayers = [...new Set(picks.map(p => p.player_name))];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-10 text-white">
        <h1 className="text-3xl font-bold mb-4">Your Portfolio</h1>

        {loading ? (
          <p className="text-purple-300 animate-pulse">Loading picks...</p>
        ) : picks.length === 0 ? (
          <p className="text-gray-400">No picks made yet.</p>
        ) : (
          <>
            <div className="mb-6 space-y-1 text-gray-300">
              <p>Total Picks: <span className="text-white font-semibold">{summary.total}</span></p>
              <p>IN Picks: <span className="text-green-400 font-semibold">{summary.in}</span></p>
              <p>OUT Picks: <span className="text-red-400 font-semibold">{summary.out}</span></p>
            </div>

            <div className="overflow-x-auto mb-10">
              <table className="min-w-full text-sm border border-purple-500/20 bg-gray-800 rounded">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="text-left px-4 py-2">Player</th>
                    <th className="text-left px-4 py-2">Pick</th>
                    <th className="text-left px-4 py-2">NET Rating</th>
                    <th className="text-left px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {picks.map(pick => (
                    <tr key={pick.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                      <td className="px-4 py-2">{pick.player_name}</td>
                      <td className={`px-4 py-2 ${pick.selection === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                        {pick.selection.toUpperCase()}
                      </td>
                      <td className="px-4 py-2">{pick.initial_net_rating}</td>
                      <td className="px-4 py-2">{new Date(pick.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-semibold mb-3">Compare NET Rating Trends</h2>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {[0, 1].map(index => (
                  <select
                    key={index}
                    value={selectedPlayers[index] || ''}
                    onChange={(e) => {
                      const updated = [...selectedPlayers];
                      updated[index] = e.target.value;
                      setSelectedPlayers(updated);
                    }}
                    className="p-2 rounded bg-gray-700 text-white"
                  >
                    <option value="">Select Player {index + 1}</option>
                    {uniquePlayers.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                ))}
              </div>

              <LineChart
                data={picks
                  .filter(p => selectedPlayers.includes(p.player_name))
                  .map(p => ({
                    date: new Date(p.created_at).toLocaleDateString(),
                    net_rating: parseFloat(p.initial_net_rating),
                    label: p.player_name,
                  }))}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
