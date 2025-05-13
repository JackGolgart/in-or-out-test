import api from '../../../../lib/bdlClient';
import { getPlayerFromCache, updatePlayerCache } from '../../../../lib/playerCache';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing player ID' });

  try {
    // Try to get from cache first
    const cachedData = await getPlayerFromCache(id);
    if (cachedData) {
      return res.status(200).json({
        player: cachedData.player,
        advancedStats: cachedData.advancedStats,
        seasonAverages: cachedData.seasonAverages,
        isCached: true
      });
    }

    console.log('Fetching player data for ID:', id);

    // If not in cache, fetch fresh data
    const [playerRes, advancedStatsRes, seasonAveragesRes] = await Promise.all([
      api.getPlayers({ player_ids: [parseInt(id)] }),
      fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${id}`, {
        headers: {
          Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
        },
      }),
      api.getPlayerStats({ player_ids: [parseInt(id)] })
    ]);

    console.log('Player response:', {
      status: playerRes?.meta?.status,
      totalCount: playerRes?.meta?.total_count,
      dataLength: playerRes?.data?.length,
      data: playerRes?.data
    });

    if (!playerRes || !playerRes.data) {
      console.error('Invalid player response:', playerRes);
      return res.status(500).json({ error: 'Invalid player data format' });
    }

    if (!Array.isArray(playerRes.data)) {
      console.error('Player data is not an array:', playerRes.data);
      return res.status(500).json({ error: 'Invalid player data format' });
    }

    const player = playerRes.data[0];
    if (!player) {
      console.error('Player not found:', id, 'Response:', playerRes);
      // Try fetching with search as fallback
      try {
        const searchRes = await api.getPlayers({ search: id.toString() });
        console.log('Search response:', {
          status: searchRes?.meta?.status,
          totalCount: searchRes?.meta?.total_count,
          dataLength: searchRes?.data?.length
        });
        
        if (searchRes?.data?.length > 0) {
          const foundPlayer = searchRes.data.find(p => p.id === parseInt(id));
          if (foundPlayer) {
            player = foundPlayer;
          }
        }
      } catch (searchError) {
        console.error('Search fallback failed:', searchError);
      }
      
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
    }

    let advancedStatsData = null;
    try {
      const advancedStats = await advancedStatsRes.json();
      if (advancedStats.data && Array.isArray(advancedStats.data)) {
        advancedStatsData = advancedStats.data[0] || null;
      }
    } catch (error) {
      console.error('Error parsing advanced stats:', error);
    }

    let seasonAverages = null;
    try {
      if (seasonAveragesRes.data && Array.isArray(seasonAveragesRes.data)) {
        seasonAverages = seasonAveragesRes.data[0] || null;
      }
    } catch (error) {
      console.error('Error parsing season averages:', error);
    }

    // Cache the new data
    const newData = {
      player,
      advancedStats: advancedStatsData,
      seasonAverages
    };

    await updatePlayerCache(player.id, newData);

    res.status(200).json({
      ...newData,
      isCached: false
    });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
} 