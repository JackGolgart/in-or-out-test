import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import BadgeNotification from '../components/BadgeNotification';

export default function Profile() {
  const { user, session } = useAuth();
  const [username, setUsername] = useState('');
  const [editing, setEditing] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [badges, setBadges] = useState([]);
  const [summary, setSummary] = useState({ in: 0, out: 0 });
  const [error, setError] = useState('');
  const [newBadge, setNewBadge] = useState(null);

  // Update summary whenever predictions change
  useEffect(() => {
    setSummary({
      in: predictions.filter(p => p.prediction_type === 'in').length,
      out: predictions.filter(p => p.prediction_type === 'out').length,
    });
  }, [predictions]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user || !session) return;

        // First try to get the profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Profile error:', profileError);
          
          // If profile doesn't exist, create it
          if (profileError.code === 'PGRST116') {
            try {
              const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert([{
                  id: user.id,
                  display_name: user.email?.split('@')[0] || ''
                }])
                .select()
                .single();

              if (createError) {
                // If we get a duplicate key error, the profile was created in between our checks
                if (createError.code === '23505') {
                  // Retry fetching the profile one more time
                  const { data: retryProfile, error: retryError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                    
                  if (retryError) throw retryError;
                  if (retryProfile?.display_name) {
                    setUsername(retryProfile.display_name);
                  }
                } else {
                  throw createError;
                }
              } else if (newProfile?.display_name) {
                setUsername(newProfile.display_name);
              }
            } catch (error) {
              console.error('Profile creation error:', error);
              throw error;
            }
          } else {
            throw profileError;
          }
        } else if (profile?.display_name) {
          setUsername(profile.display_name);
        }

        // Fetch predictions from API endpoint
        const response = await fetch('/api/predictions', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch predictions');
        
        const predictionsData = await response.json();
        setPredictions(predictionsData || []);

        const { data: badgeData, error: badgeError } = await supabase
          .from('user_badges')
          .select('earned_at, badges(name, description, icon)')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false });

        if (badgeError) throw badgeError;

        const newBadges = badgeData || [];
        setBadges(newBadges);

        // Check for new badges
        if (badges.length > 0 && newBadges.length > badges.length) {
          const latestBadge = newBadges[0].badges;
          setNewBadge(latestBadge);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        setError('Failed to load profile data');
      }
    };

    loadData();
  }, [user, session]);

  const saveUsername = async () => {
    try {
      setError('');
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user;
      if (!user) {
        setError('No user session found');
        return;
      }

      // Validate username
      if (!username.trim()) {
        setError('Username cannot be empty');
        return;
      }

      const { data, error: updateError } = await supabase
        .from('users')
        .update({ display_name: username.trim() })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      if (data) {
        setUsername(data.display_name);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error saving username:', error);
      setError(error.message || 'Failed to save username');
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
          <h2 className="text-xl font-semibold mb-4">Badges</h2>
          {badges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map(({ badges: badge, earned_at }) => (
                <div 
                  key={badge.name} 
                  className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={badge.icon} 
                        alt={badge.name} 
                        className="w-12 h-12 rounded-lg bg-gray-700/50 p-2"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-purple-300 text-lg">{badge.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{badge.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Earned: {new Date(earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <p className="text-gray-400">No badges earned yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Make predictions and achieve milestones to earn badges!
              </p>
            </div>
          )}
        </div>

        {newBadge && (
          <BadgeNotification
            badge={newBadge}
            onClose={() => setNewBadge(null)}
          />
        )}
      </div>
    </Layout>
  );
}
