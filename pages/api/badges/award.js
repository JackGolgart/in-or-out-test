import { createClient } from '@supabase/supabase-js';

// Badge definitions
const BADGES = {
  FIRST_PREDICTION: {
    name: 'First Steps',
    description: 'Made your first prediction',
    icon: '/badges/first-prediction.svg'
  },
  PREDICTION_STREAK: {
    name: 'Hot Streak',
    description: 'Made 5 predictions in a row',
    icon: '/badges/hot-streak.svg'
  },
  PERFECT_PREDICTION: {
    name: 'Perfect Prediction',
    description: 'Made a prediction that was exactly right',
    icon: '/badges/perfect-prediction.svg'
  },
  IN_MASTER: {
    name: 'IN Master',
    description: 'Made 10 successful IN predictions',
    icon: '/badges/in-master.svg'
  },
  OUT_MASTER: {
    name: 'OUT Master',
    description: 'Made 10 successful OUT predictions',
    icon: '/badges/out-master.svg'
  },
  DIVERSITY: {
    name: 'Diverse Predictor',
    description: 'Made predictions for 5 different players',
    icon: '/badges/diversity.svg'
  }
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ status: 'ok' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided in authorization header' });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { prediction_id, prediction_type, net_rating, current_net_rating } = req.body;

    // Get user's existing badges
    const { data: existingBadges, error: badgeError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', user.id);

    if (badgeError) throw badgeError;

    const awardedBadges = [];

    // Check for First Prediction badge
    if (!existingBadges?.length) {
      const { data: firstBadge, error: firstError } = await supabase
        .from('badges')
        .insert([BADGES.FIRST_PREDICTION])
        .select()
        .single();

      if (firstError) throw firstError;

      const { error: userBadgeError } = await supabase
        .from('user_badges')
        .insert([{
          user_id: user.id,
          badge_id: firstBadge.id,
          earned_at: new Date().toISOString()
        }]);

      if (userBadgeError) throw userBadgeError;
      awardedBadges.push(BADGES.FIRST_PREDICTION);
    }

    // Check for Perfect Prediction badge
    if (Math.abs(net_rating - current_net_rating) <= 0.1) {
      const { data: perfectBadge, error: perfectError } = await supabase
        .from('badges')
        .insert([BADGES.PERFECT_PREDICTION])
        .select()
        .single();

      if (perfectError) throw perfectError;

      const { error: userBadgeError } = await supabase
        .from('user_badges')
        .insert([{
          user_id: user.id,
          badge_id: perfectBadge.id,
          earned_at: new Date().toISOString()
        }]);

      if (userBadgeError) throw userBadgeError;
      awardedBadges.push(BADGES.PERFECT_PREDICTION);
    }

    // Check for IN/OUT Master badges
    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('prediction_type', prediction_type);

    if (predictionsError) throw predictionsError;

    if (predictions?.length >= 10) {
      const badgeKey = prediction_type === 'in' ? 'IN_MASTER' : 'OUT_MASTER';
      const { data: masterBadge, error: masterError } = await supabase
        .from('badges')
        .insert([BADGES[badgeKey]])
        .select()
        .single();

      if (masterError) throw masterError;

      const { error: userBadgeError } = await supabase
        .from('user_badges')
        .insert([{
          user_id: user.id,
          badge_id: masterBadge.id,
          earned_at: new Date().toISOString()
        }]);

      if (userBadgeError) throw userBadgeError;
      awardedBadges.push(BADGES[badgeKey]);
    }

    // Check for Diversity badge
    const { data: uniquePlayers, error: uniqueError } = await supabase
      .from('predictions')
      .select('player_id')
      .eq('user_id', user.id);

    if (uniqueError) throw uniqueError;

    const uniquePlayerCount = new Set(uniquePlayers?.map(p => p.player_id)).size;
    if (uniquePlayerCount >= 5) {
      const { data: diversityBadge, error: diversityError } = await supabase
        .from('badges')
        .insert([BADGES.DIVERSITY])
        .select()
        .single();

      if (diversityError) throw diversityError;

      const { error: userBadgeError } = await supabase
        .from('user_badges')
        .insert([{
          user_id: user.id,
          badge_id: diversityBadge.id,
          earned_at: new Date().toISOString()
        }]);

      if (userBadgeError) throw userBadgeError;
      awardedBadges.push(BADGES.DIVERSITY);
    }

    return res.status(200).json({ awardedBadges });
  } catch (error) {
    console.error('Error awarding badges:', error);
    return res.status(500).json({ error: 'Failed to award badges' });
  }
} 