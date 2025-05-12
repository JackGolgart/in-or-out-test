import api from '../../../lib/bdlClient';
import { getPlayerFromCache, updatePlayerCache } from '../../../lib/playerCache';

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

    // If not in cache, fetch fresh data
    const [playerRes, advancedStatsRes, seasonAveragesRes] = await Promise.all([
      api.nba.getPlayers({ search: id }),
      fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${id}`, {
        headers: {
          Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
        },
      }),
      api.nba.getSeasonAverages({
        player_ids: [parseInt(id)],
        season: 2023,
      })
    ]);

    const player = playerRes.data.find(p => String(p.id) === id);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const advancedStats = await advancedStatsRes.json();
    const advancedStatsData = advancedStats.data.length > 0 ? advancedStats.data[0] : null;
    const seasonAverages = seasonAveragesRes.data.length > 0 ? seasonAveragesRes.data[0] : null;

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
    res.status(500).json({ error: 'Internal error' });
  }
}
