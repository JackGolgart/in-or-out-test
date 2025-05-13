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
  // Set JSON content type for all responses
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Player ID is required' });
  }

  const currentSeason = getCurrentNBASeason();

  try {
    console.log('Fetching player data for ID:', id);
    
    // Fetch player data using getPlayers instead of getPlayer
    const playerResponse = await api.nba.getPlayers({ 
      player_ids: [parseInt(id)]
    });

    console.log('Player API Response:', {
      status: 'success',
      hasData: !!playerResponse?.data,
      dataLength: playerResponse?.data?.length,
      firstPlayer: playerResponse?.data?.[0]?.id
    });

    if (!playerResponse?.data?.[0]) {
      console.error('Player not found in API response:', { 
        id, 
        response: JSON.stringify(playerResponse, null, 2)
      });
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = playerResponse.data[0];
    console.log('Found player:', { id: player.id, name: `${player.first_name} ${player.last_name}` });

    try {
      // Fetch player stats to get current team
      const statsResponse = await api.nba.getStats({
        player_ids: [parseInt(id)],
        seasons: [currentSeason],
        per_page: 1, // We only need the most recent game to get current team
        sort: ['-game.date'] // Sort by most recent game first
      });

      console.log('Stats API Response:', {
        hasData: !!statsResponse?.data,
        dataLength: statsResponse?.data?.length,
        firstGame: statsResponse?.data?.[0]?.game?.date
      });

      // Update player's team if they have recent games
      if (statsResponse?.data?.[0]?.team) {
        player.team = statsResponse.data[0].team;
        console.log('Updated player team:', {
          id: player.id,
          name: `${player.first_name} ${player.last_name}`,
          team: player.team.full_name
        });
      }

      // Fetch all player stats for season averages
      const allStatsResponse = await api.nba.getStats({
        player_ids: [parseInt(id)],
        seasons: [currentSeason],
        per_page: 25
      });

      // Calculate season averages
      let seasonAverages = null;
      if (allStatsResponse?.data?.length > 0) {
        const stats = allStatsResponse.data;
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
        gameStats: allStatsResponse?.data || []
      });
    } catch (statsError) {
      console.error('Error fetching player stats:', statsError);
      // Return player data even if stats fetch fails
      return res.status(200).json({
        player,
        seasonAverages: null,
        gameStats: [],
        error: 'Failed to fetch player stats'
      });
    }
  } catch (error) {
    console.error('Error fetching player data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch player data',
      details: error.message
    });
  }
} 