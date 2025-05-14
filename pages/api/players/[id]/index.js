import { getApiClient } from '../../../../lib/bdlClient';

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  
  // NBA season starts in October (month 10)
  // If we're before October, use previous year as the season start
  return month < 10 ? year - 1 : year;
}

// Function to get season start and end dates
function getSeasonDates(season) {
  const startDate = new Date(season, 9, 1); // October 1st
  const endDate = new Date(season + 1, 5, 30); // June 30th
  return { startDate, endDate };
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
    const { startDate, endDate } = getSeasonDates(currentSeason);

    // Format dates for API
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // First, get the player's basic information
    console.log('Fetching player data for ID:', id);
    const playersResponse = await apiInstance.nba.getPlayers({
      player_ids: [parseInt(id)],
      per_page: 1
    }).catch(error => {
      console.error('Error fetching player data:', {
        error: error.message,
        playerId: id,
        apiVersion: 'v1',
        stack: error.stack
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
      initialTeam: player.team?.full_name,
      position: player.position,
      jerseyNumber: player.jersey_number
    });

    // Fetch regular season stats
    console.log('Fetching stats for player:', {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      season: currentSeason
    });

    const statsResponse = await apiInstance.nba.getStats({
      player_ids: [parseInt(id)],
      seasons: [currentSeason],
      per_page: 100, // Increased to ensure we get enough games
      sort: ['-game.date'] // Sort by most recent first
    }).catch(error => {
      console.error('Error fetching player stats:', {
        error: error.message,
        playerId: id,
        season: currentSeason,
        apiVersion: 'v1',
        stack: error.stack
      });
      throw error;
    });

    const allGames = statsResponse?.data || [];
    console.log('Stats response:', {
      totalGames: allGames.length,
      firstGame: allGames[0] ? {
        date: allGames[0].game.date,
        isPlayoff: allGames[0].game.postseason,
        status: allGames[0].game.status,
        team: allGames[0].team?.full_name
      } : null
    });

    // Get today's date for filtering
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day to include today's games

    // Filter games up to today's date and sort by most recent
    const recentGames = allGames
      .filter(g => {
        const gameDate = new Date(g.game.date);
        return gameDate <= today;
      })
      .sort((a, b) => new Date(b.game.date) - new Date(a.game.date));

    // Filter regular season and playoff games
    const regularGames = recentGames.filter(g => g.game.postseason === false);
    const playoffGames = recentGames.filter(g => g.game.postseason === true);

    console.log('Game filtering:', {
      totalGames: allGames.length,
      recentGames: recentGames.length,
      regularGames: regularGames.length,
      playoffGames: playoffGames.length,
      firstRegularGame: regularGames[0] ? {
        date: regularGames[0].game.date,
        postseason: regularGames[0].game.postseason,
        status: regularGames[0].game.status
      } : null,
      firstPlayoffGame: playoffGames[0] ? {
        date: playoffGames[0].game.date,
        postseason: playoffGames[0].game.postseason,
        status: playoffGames[0].game.status
      } : null
    });

    // Calculate averages
    const regularAverages = calculateAverages(regularGames);
    const playoffAverages = calculateAverages(playoffGames);

    // Use regular season averages by default
    let seasonAverages = regularAverages;

    // Get most recent game for team info
    let currentTeam = player.team;
    if (recentGames.length > 0) {
      const mostRecent = recentGames[0];
      if (mostRecent.team) {
        console.log('Updating team from recent game:', {
          oldTeam: currentTeam?.full_name,
          newTeam: mostRecent.team.full_name,
          gameDate: mostRecent.game.date
        });
        currentTeam = mostRecent.team;
      }
    }

    player.team = currentTeam;

    // Prepare recent games (last 5 games)
    const lastFiveGames = [...regularGames, ...playoffGames]
      .sort((a, b) => new Date(b.game.date) - new Date(a.game.date))
      .slice(0, 5)
      .map(game => {
        const isPlayoff = game.game.postseason === true;
        console.log('Processing game:', {
          date: game.game.date,
          postseason: game.game.postseason,
          isPlayoff,
          team: game.team?.full_name,
          rawGame: game // Log the entire game object
        });
        
        const processedGame = {
          date: game.game.date,
          opponent: game.game.home_team_id === game.team.id ? game.game.visitor_team_id : game.game.home_team_id,
          points: game.pts || 0,
          rebounds: game.reb || 0,
          assists: game.ast || 0,
          minutes: game.min || '0',
          result: game.game.home_team_score > game.game.visitor_team_score ? 'W' : 'L',
          score: `${game.game.home_team_score}-${game.game.visitor_team_score}`,
          isPlayoff,
          gameType: isPlayoff ? 'Playoff' : 'Regular Season'
        };

        console.log('Processed game:', {
          date: processedGame.date,
          isPlayoff: processedGame.isPlayoff,
          type: processedGame.gameType
        });

        return processedGame;
      });

    console.log('Final player data:', {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      team: player.team?.full_name,
      games: seasonAverages.games_played,
      recentGames: lastFiveGames.length,
      hasRegularGames: regularGames.length > 0,
      hasPlayoffGames: playoffGames.length > 0,
      firstGame: lastFiveGames[0] ? {
        date: lastFiveGames[0].date,
        isPlayoff: lastFiveGames[0].isPlayoff,
        type: lastFiveGames[0].gameType,
        rawGame: lastFiveGames[0]
      } : null,
      allGames: lastFiveGames.map(g => ({
        date: g.date,
        isPlayoff: g.isPlayoff,
        type: g.gameType
      }))
    });

    return res.status(200).json({
      player: {
        ...player,
        season_averages: seasonAverages,
        regular_averages: regularAverages,
        playoff_averages: playoffAverages,
        recent_games: lastFiveGames,
        is_in_playoffs: playoffGames.length > 0
      }
    });

  } catch (error) {
    console.error('Error in player detail API:', {
      message: error.message,
      stack: error.stack,
      playerId: id,
      season: currentSeason
    });
    
    // Return more specific error information
    return res.status(500).json({ 
      error: 'Failed to fetch player data',
      details: error.message,
      playerId: id
    });
  }
} 