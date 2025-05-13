import api from '../../../../lib/bdlClient';
import { getPlayerFromCache, updatePlayerCache } from '../../../../lib/playerCache';

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

    // If not in cache, fetch fresh data using getPlayers with specific ID
    const playerRes = await api.nba.getPlayers({ 
      player_ids: [parseInt(id)]
    });

    console.log('Player API Response:', {
      status: 'success',
      hasData: !!playerRes?.data,
      dataLength: playerRes?.data?.length,
      firstPlayer: playerRes?.data?.[0]?.id,
      response: JSON.stringify(playerRes, null, 2)
    });

    if (!playerRes?.data?.[0]) {
      console.error('Player not found in API response:', { 
        id, 
        response: JSON.stringify(playerRes, null, 2),
        apiKey: process.env.BALLDONTLIE_API_KEY ? 'Present' : 'Missing'
      });
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = playerRes.data[0];
    console.log('Found player from API:', { id: player.id, name: `${player.first_name} ${player.last_name}` });

    const currentSeason = getCurrentNBASeason();

    // Get season averages and advanced stats
    let seasonAverages = null;
    let advancedStats = null;
    try {
      const [averages, advancedStatsRes] = await Promise.all([
        api.nba.getPlayerStats({
          player_ids: [parseInt(id)],
          seasons: [currentSeason]
        }),
        fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${id}&seasons[]=${currentSeason}&per_page=100`, {
          headers: {
            Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
          },
        })
      ]);

      seasonAverages = averages.data?.[0] || null;
      const advancedStatsData = await advancedStatsRes.json();
      advancedStats = advancedStatsData.data?.[0] || null;

      if (seasonAverages) {
        console.log('Found season averages for player:', { id, season: currentSeason });
      }
      if (advancedStats) {
        console.log('Found advanced stats for player:', { id, season: currentSeason, netRating: advancedStats.net_rating });
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }

    // Combine the stats
    if (seasonAverages && advancedStats) {
      seasonAverages = {
        ...seasonAverages,
        net_rating: advancedStats.net_rating
      };
    }

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