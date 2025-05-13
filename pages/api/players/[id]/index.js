import api from '../../../../lib/bdlClient';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const currentSeason = getCurrentNBASeason();

  try {
    console.log('Fetching player data for ID:', id);
    
    // Fetch player data
    const playerResponse = await api.nba.getPlayer({ id: parseInt(id) });
    if (!playerResponse || !playerResponse.data) {
      console.error('No player data found for ID:', id);
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = playerResponse.data;

    // Fetch player stats
    const statsResponse = await api.nba.getStats({
      player_ids: [parseInt(id)],
      seasons: [currentSeason],
      per_page: 25
    });

    // Calculate season averages
    let seasonAverages = null;
    if (statsResponse && statsResponse.data && statsResponse.data.length > 0) {
      const stats = statsResponse.data;
      const totalGames = stats.length;
      
      seasonAverages = {
        games_played: totalGames,
        pts: (stats.reduce((sum, game) => sum + (game.pts || 0), 0) / totalGames).toFixed(1),
        reb: (stats.reduce((sum, game) => sum + (game.reb || 0), 0) / totalGames).toFixed(1),
        ast: (stats.reduce((sum, game) => sum + (game.ast || 0), 0) / totalGames).toFixed(1),
        min: (stats.reduce((sum, game) => sum + (parseFloat(game.min) || 0), 0) / totalGames).toFixed(1),
        fg_pct: (stats.reduce((sum, game) => sum + (game.fg_pct || 0), 0) / totalGames).toFixed(3),
        fg3_pct: (stats.reduce((sum, game) => sum + (game.fg3_pct || 0), 0) / totalGames).toFixed(3),
        ft_pct: (stats.reduce((sum, game) => sum + (game.ft_pct || 0), 0) / totalGames).toFixed(3),
        stl: (stats.reduce((sum, game) => sum + (game.stl || 0), 0) / totalGames).toFixed(1),
        blk: (stats.reduce((sum, game) => sum + (game.blk || 0), 0) / totalGames).toFixed(1),
        turnover: (stats.reduce((sum, game) => sum + (game.turnover || 0), 0) / totalGames).toFixed(1),
        pf: (stats.reduce((sum, game) => sum + (game.pf || 0), 0) / totalGames).toFixed(1)
      };
    }

    // Return combined data
    return res.status(200).json({
      player,
      seasonAverages,
      gameStats: statsResponse?.data || []
    });

  } catch (error) {
    console.error('Error fetching player data:', error);
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
} 