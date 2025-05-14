import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user } = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1]);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { player_id, prediction_type, net_rating } = req.body;

      if (!player_id || !prediction_type || !net_rating) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!['in', 'out'].includes(prediction_type)) {
        return res.status(400).json({ error: 'Invalid prediction type' });
      }

      const { data, error } = await supabase
        .from('predictions')
        .upsert({
          user_id: user.id,
          player_id,
          prediction_type,
          net_rating_at_prediction: net_rating
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return res.status(200).json(data);
    }
  } catch (error) {
    console.error('Error in predictions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 