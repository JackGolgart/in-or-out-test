import api from '../../../../lib/bdlClient';
import { getPlayerFromCache, updatePlayerCache } from '../../../../lib/playerCache';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing player ID' });

  try {
    // Try to get from cache first
    const cachedData = await getPlayerFromCache(id);
    if (cachedData) {
      console.log('Returning cached player data for ID:', id);
      return res.status(200).json({
        player: cachedData.player,
        seasonAverages: cachedData.seasonAverages,
        isCached: true
      });
    }

    console.log('Fetching fresh player data for ID:', id);

    // If not in cache, fetch fresh data
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
    const newData = {
      player,
      seasonAverages
    };

    await updatePlayerCache(player.id, newData);

    console.log('Successfully fetched and cached player data for ID:', id);
    res.status(200).json(newData);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
} 