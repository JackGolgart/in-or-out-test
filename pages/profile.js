import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

export default function Profile() {
  const [username, setUsername] = useState('');
  const [editing, setEditing] = useState(false);
  const [picks, setPicks] = useState([]);
  const [badges, setBadges] = useState([]);
  const [summary, setSummary] = useState({ in: 0, out: 0 });
  const [error, setError] = useState('');

  // Update summary whenever picks change
  useEffect(() => {
    setSummary({
      in: picks.filter(p => p.prediction_type === 'in').length,
      out: picks.filter(p => p.prediction_type === 'out').length,
    });
  }, [picks]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = await supabase.auth.getSession();
        const user = session?.data?.session?.user;
        if (!user) return;

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        if (profile?.username) setUsername(profile.username);

        const { data: picksData, error: picksError } = await supabase
          .from('picks')
          .select('*')
          .eq('user_id', user.id);

        if (picksError) throw picksError;

        const { data: badgeData, error: badgeError } = await supabase
          .from('user_badges')
          .select('earned_at, badges(name, description, icon)')
          .eq('user_id', user.id);

        if (badgeError) throw badgeError;

        setPicks(picksData || []);
        setBadges(badgeData || []);
      } catch (error) {
        console.error('Error loading profile data:', error);
        setError('Failed to load profile data');
      }
    };

    loadData();
  }, []);

  const saveUsername = async () => {
    try {
      setError('');
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user;
      if (!user) return;

      const { error: updateError } = await supabase
        .from('users')
        .update({ username })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setEditing(false);
    } catch (error) {
      console.error('Error saving username:', error);
      setError('Failed to save username');
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6 text-white">
        <h1 className="text-3xl font-bold mb-4">Your Profile</h1>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="text-sm text-gray-300">Username:</label>
          {editing ? (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-gray-800 p-2 rounded"
              />
              <button onClick={saveUsername} className="bg-purple-600 px-4 py-2 rounded">Save</button>
              <button onClick={() => setEditing(false)} className="bg-gray-600 px-4 py-2 rounded">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{username || 'Set a username'}</span>
              <button onClick={() => setEditing(true)} className="text-sm text-purple-400 hover:underline">Edit</button>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Stats</h2>
          <p className="text-gray-300">Total IN Picks: <span className="text-green-400">{summary.in}</span></p>
          <p className="text-gray-300">Total OUT Picks: <span className="text-red-400">{summary.out}</span></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Badges</h2>
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {badges.map(({ badges: badge, earned_at }) => (
                <div key={badge.name} className="bg-gray-800 p-4 rounded shadow">
                  <img src={badge.icon} alt={badge.name} className="w-10 h-10 mb-2" />
                  <h3 className="font-bold text-purple-300">{badge.name}</h3>
                  <p className="text-xs text-gray-400">{badge.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Earned: {new Date(earned_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No badges earned yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
