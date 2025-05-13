import { getApiClient } from '../../../../lib/bdlClient';

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
  
  // If we're in the first half of the year (before July), use previous year as season start
  return currentMonth < 7 ? currentYear - 1 : currentYear;
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

  try {
    const apiInstance = getApiClient();
    const currentSeason = getCurrentNBASeason();

    // First, get the player's basic information
    console.log('Fetching player data for ID:', id);
    const playersResponse = await apiInstance.nba.getPlayers({
      player_ids: [id],
      per_page: 1
    });

    if (!playersResponse?.data?.length) {
      console.log('No player data found for ID:', id);
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = playersResponse.data[0];
    console.log('Found player:', player.first_name, player.last_name);

    // Get the player's most recent game to determine current team
    console.log('Fetching most recent game for team info');
    const recentStatsResponse = await apiInstance.nba.getStats({
      player_ids: [id],
      seasons: [currentSeason],
      per_page: 1,
      sort: ['-game.date']
    });

    // Update team information if we have recent game data
    if (recentStatsResponse?.data?.length > 0) {
      const recentGame = recentStatsResponse.data[0];
      if (recentGame.team) {
        console.log('Updating team info from recent game:', recentGame.team.full_name);
        player.team = recentGame.team;
      }
    }

    // Get all player stats for the current season
    console.log('Fetching all player stats for season averages');
    const statsResponse = await apiInstance.nba.getStats({
      player_ids: [id],
      seasons: [currentSeason],
      per_page: 25
    });

    let seasonAverages = {
      points: 0,
      rebounds: 0,
      assists: 0,
      games_played: 0
    };

    if (statsResponse?.data?.length > 0) {
      const stats = statsResponse.data;
      const totalGames = stats.length;
      
      seasonAverages = {
        points: stats.reduce((sum, game) => sum + (game.pts || 0), 0) / totalGames,
        rebounds: stats.reduce((sum, game) => sum + (game.reb || 0), 0) / totalGames,
        assists: stats.reduce((sum, game) => sum + (game.ast || 0), 0) / totalGames,
        games_played: totalGames
      };
    }

    // Get recent games (last 5)
    const recentGames = statsResponse?.data?.slice(0, 5).map(game => ({
      date: game.game.date,
      opponent: game.game.home_team_id === game.team.id ? 
        game.game.visitor_team_id : game.game.home_team_id,
      points: game.pts,
      rebounds: game.reb,
      assists: game.ast,
      minutes: game.min,
      result: game.game.home_team_score > game.game.visitor_team_score ? 'W' : 'L',
      score: `${game.game.home_team_score}-${game.game.visitor_team_score}`
    })) || [];

    return res.status(200).json({
      player: {
        ...player,
        season_averages: seasonAverages,
        recent_games: recentGames
      }
    });

  } catch (error) {
    console.error('Error in player detail API:', error);
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
} 