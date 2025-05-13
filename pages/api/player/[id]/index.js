import api from '../../../../lib/bdlClient';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  
  // NBA season starts in October (month 10)
  // If we're before October, use previous year as the season start
  return month < 10 ? year - 1 : year;
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing player ID' });

  try {
    // First try to get from cache
    const { data: cached, error: cacheError } = await supabase
      .from('player_cache')
      .select('*')
      .eq('player_id', id)
      .maybeSingle();

    const isFresh = cached && cached.updated_at && Date.now() - new Date(cached.updated_at).getTime() < 86400000;

    if (isFresh) {
      console.log('Returning cached player data for ID:', id);
      return res.status(200).json({
        player: cached.player,
        seasonAverages: cached.season_averages,
      });
    }

    // If not in cache or not fresh, fetch from API
    console.log('Fetching fresh player data for ID:', id);
    
    // Try to get player data using the players endpoint with search
    const playerRes = await api.nba.getPlayers({ 
      player_ids: [parseInt(id)],
      per_page: 1
    });

    if (!playerRes?.data?.[0]) {
      console.error('Player not found in API response:', { id, response: playerRes });
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = playerRes.data[0];
    const currentSeason = getCurrentNBASeason();

    // Get season averages
    const averages = await api.nba.getSeasonAverages({
      player_ids: [parseInt(id)],
      season: currentSeason,
    });

    const seasonAverages = averages.data.length > 0 ? averages.data[0] : null;

    // Cache the results
    await supabase.from('player_cache').upsert({
      player_id: player.id,
      player,
      season_averages: seasonAverages,
      updated_at: new Date().toISOString(),
    });

    console.log('Successfully fetched and cached player data for ID:', id);
    res.status(200).json({ player, seasonAverages });
  } catch (err) {
    console.error('API error for player ID:', id, err);
    res.status(500).json({ error: 'Internal error', details: err.message });
  }
} 