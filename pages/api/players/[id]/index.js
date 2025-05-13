import { getApiClient } from '../../../../lib/bdlClient';

// Function to get current NBA season
function getCurrentNBASeason() {
  // For the 2024-2025 season, we'll use 2024 as the season year
  return 2024;
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
    console.log('Using season:', currentSeason);

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
    console.log('Found player:', {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      initialTeam: player.team?.full_name
    });

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
      console.log('Recent game data:', {
        date: recentGame.game.date,
        team: recentGame.team?.full_name,
        opponent: recentGame.game.home_team_id === recentGame.team.id ? 
          'vs ' + recentGame.game.visitor_team_id : 
          'at ' + recentGame.game.home_team_id
      });

      if (recentGame.team) {
        console.log('Updating team info from recent game:', {
          oldTeam: player.team?.full_name,
          newTeam: recentGame.team.full_name
        });
        player.team = recentGame.team;
      }
    } else {
      console.log('No recent games found for team update');
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

      console.log('Calculated season averages:', {
        games: totalGames,
        points: seasonAverages.points.toFixed(1),
        rebounds: seasonAverages.rebounds.toFixed(1),
        assists: seasonAverages.assists.toFixed(1)
      });
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

    console.log('Final player data:', {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      team: player.team?.full_name,
      games: seasonAverages.games_played,
      recentGames: recentGames.length
    });

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