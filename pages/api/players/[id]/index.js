import { getApiClient } from '../../../../lib/bdlClient';

// Function to get current NBA season
function getCurrentNBASeason() {
  // For the 2024-2025 season, we'll use 2024 as the season year
  return 2024;
}

function calculateAverages(games) {
  if (!games.length) return {
    points: 0, rebounds: 0, assists: 0, games_played: 0
  };
  return {
    points: games.reduce((sum, g) => sum + (g.pts || 0), 0) / games.length,
    rebounds: games.reduce((sum, g) => sum + (g.reb || 0), 0) / games.length,
    assists: games.reduce((sum, g) => sum + (g.ast || 0), 0) / games.length,
    games_played: games.length
  };
}

export default async function handler(req, res) {
  // Set JSON content type for all responses
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, season } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Player ID is required' });
  }

  try {
    const apiInstance = getApiClient();
    const currentSeason = getCurrentNBASeason();
    const requestedSeason = season ? parseInt(season) : currentSeason;
    console.log('Using season:', requestedSeason);

    // First, get the player's basic information
    console.log('Fetching player data for ID:', id);
    const playersResponse = await apiInstance.nba.getPlayers({
      player_ids: [parseInt(id)],
      per_page: 1
    }).catch(error => {
      console.error('Error fetching player data:', {
        error: error.message,
        playerId: id,
        apiVersion: 'v1'
      });
      throw error;
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

    // Get all stats for the requested season (max 100 games)
    console.log('Fetching stats for season:', requestedSeason);
    const statsResponse = await apiInstance.nba.getStats({
      player_ids: [parseInt(id)],
      seasons: [requestedSeason],
      per_page: 100,
      sort: ['-game.date']
    }).catch(error => {
      console.error('Error fetching player stats:', {
        error: error.message,
        playerId: id,
        season: requestedSeason,
        apiVersion: 'v1'
      });
      throw error;
    });
    const allGames = statsResponse?.data || [];

    // Filter out preseason games (status === 'Preseason' or postseason === false and date before regular season start)
    const regularGames = allGames.filter(g => !g.game.postseason && g.game.status !== 'Preseason');
    const playoffGames = allGames.filter(g => g.game.postseason);

    // Calculate averages
    const regularAverages = calculateAverages(regularGames);
    const playoffAverages = calculateAverages(playoffGames);

    // For previous seasons, use API's season averages if not current season
    let seasonAverages = regularAverages;
    if (requestedSeason !== currentSeason) {
      // Try to fetch season averages from API
      try {
        const avgRes = await fetch(`https://api.balldontlie.io/v1/season_averages?season=${requestedSeason}&player_ids[]=${id}`, {
          headers: {
            Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
          },
        });
        if (avgRes.ok) {
          const avgData = await avgRes.json();
          if (avgData.data && avgData.data.length > 0) {
            const avg = avgData.data[0];
            seasonAverages = {
              points: avg.pts ?? 0,
              rebounds: avg.reb ?? 0,
              assists: avg.ast ?? 0,
              games_played: avg.games_played ?? 0
            };
          }
        }
      } catch (err) {
        console.error('Error fetching season averages:', err);
      }
    }

    // Get most recent game for team info
    let currentTeam = player.team;
    if (regularGames.length > 0) {
      const mostRecent = regularGames[0];
      if (mostRecent.team) currentTeam = mostRecent.team;
    }
    player.team = currentTeam;

    // Prepare recent games (last 5 regular season games)
    const recentGames = regularGames.slice(0, 5).map(game => ({
      date: game.game.date,
      opponent: game.game.home_team_id === game.team.id ? game.game.visitor_team_id : game.game.home_team_id,
      points: game.pts,
      rebounds: game.reb,
      assists: game.ast,
      minutes: game.min,
      result: game.game.home_team_score > game.game.visitor_team_score ? 'W' : 'L',
      score: `${game.game.home_team_score}-${game.game.visitor_team_score}`
    }));

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
        regular_averages: regularAverages,
        playoff_averages: playoffAverages,
        recent_games: recentGames
      }
    });

  } catch (error) {
    console.error('Error in player detail API:', {
      message: error.message,
      stack: error.stack,
      playerId: id,
      season: requestedSeason
    });
    
    // Return more specific error information
    return res.status(500).json({ 
      error: 'Failed to fetch player data',
      details: error.message,
      playerId: id
    });
  }
} 