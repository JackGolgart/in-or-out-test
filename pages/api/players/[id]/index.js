import { getApiClient, getAdvancedStats } from '../../../../lib/bdlClient';

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
  // Filter out games where the player didn't play (minutes = 0 or '00')
  const playedGames = games.filter(g => {
    const minutes = g.min;
    return minutes && minutes !== '00' && minutes !== '0';
  });

  if (!playedGames.length) return {
    points: 0, rebounds: 0, assists: 0, games_played: 0
  };

  return {
    points: playedGames.reduce((sum, g) => sum + (g.pts || 0), 0) / playedGames.length,
    rebounds: playedGames.reduce((sum, g) => sum + (g.reb || 0), 0) / playedGames.length,
    assists: playedGames.reduce((sum, g) => sum + (g.ast || 0), 0) / playedGames.length,
    games_played: playedGames.length
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  let regularNetRatings = [];
  let playoffNetRatings = [];
  let regularNetRating = 0;
  let playoffNetRating = 0;
  let netRating = 0;

  console.log('API handler called:', {
    method: req.method,
    playerId: id,
    hasApiKey: !!apiKey,
    url: req.url,
    query: req.query
  });

  if (!apiKey) {
    console.error('BallDontLie API key is not configured');
    return res.status(500).json({ message: 'API key not configured' });
  }

  try {
    // Get current season
    const currentSeason = getCurrentNBASeason();
    console.log('Fetching player data for ID:', id, 'Season:', currentSeason);

    // Initialize API client
    const apiInstance = getApiClient();

    // Fetch player data
    const playerResponse = await apiInstance.nba.getPlayer(id).catch(error => {
      console.error('Error fetching player data:', {
        error: error.message,
        playerId: id,
        apiVersion: 'v1',
        stack: error.stack
      });
      throw error;
    });

    if (!playerResponse?.data) {
      console.error('No player data found:', { playerId: id });
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = playerResponse.data;
    console.log('Player data:', {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      team: player.team?.full_name
    });

    // Fetch advanced stats for net rating
    let advancedStats = null;
    try {
      console.log('Starting advanced stats fetch:', {
        playerId: id,
        season: currentSeason,
        hasApiKey: !!apiKey
      });

      advancedStats = await getAdvancedStats(parseInt(id), currentSeason);
      console.log('Advanced stats response:', {
        hasData: !!advancedStats?.data,
        dataLength: advancedStats?.data?.length,
        firstPlayer: advancedStats?.data?.[0]?.player_id,
        netRating: advancedStats?.data?.[0]?.net_rating
      });

      if (!advancedStats?.data) {
        console.error('Invalid advanced stats response:', advancedStats);
        throw new Error('Invalid advanced stats response');
      }

      if (advancedStats.data.length === 0) {
        console.log('No advanced stats found for player:', {
          playerId: id,
          season: currentSeason
        });
      } else {
        // Separate regular season and playoff games
        const regularSeasonStats = advancedStats.data.filter(stat => !stat.game?.postseason);
        const playoffStats = advancedStats.data.filter(stat => stat.game?.postseason);

        console.log('Advanced stats breakdown:', {
          totalGames: advancedStats.data.length,
          regularSeasonGames: regularSeasonStats.length,
          playoffGames: playoffStats.length,
          sampleRegularGame: regularSeasonStats[0],
          samplePlayoffGame: playoffStats[0]
        });

        // Calculate net ratings
        regularNetRatings = regularSeasonStats
          .filter(stat => {
            // Only check if net rating exists
            console.log('Filtering regular season stat:', {
              gameId: stat.game?.id,
              date: stat.game?.date,
              netRating: stat.net_rating,
              rawStat: stat
            });
            return stat.net_rating !== null && 
                   stat.net_rating !== undefined;
          })
          .map(stat => {
            console.log('Mapping regular season stat:', {
              gameId: stat.game?.id,
              date: stat.game?.date,
              netRating: stat.net_rating,
              rawStat: stat
            });
            return {
              game_id: stat.game?.id,
              net_rating: Number(stat.net_rating),
              date: stat.game?.date
            };
          });

        playoffNetRatings = playoffStats
          .filter(stat => {
            // Only check if net rating exists
            console.log('Filtering playoff stat:', {
              gameId: stat.game?.id,
              date: stat.game?.date,
              netRating: stat.net_rating,
              rawStat: stat
            });
            return stat.net_rating !== null && 
                   stat.net_rating !== undefined;
          })
          .map(stat => {
            console.log('Mapping playoff stat:', {
              gameId: stat.game?.id,
              date: stat.game?.date,
              netRating: stat.net_rating,
              rawStat: stat
            });
            return {
              game_id: stat.game?.id,
              net_rating: Number(stat.net_rating),
              date: stat.game?.date
            };
          });

        console.log('Net rating arrays:', {
          regularNetRatings,
          playoffNetRatings,
          regularCount: regularNetRatings.length,
          playoffCount: playoffNetRatings.length,
          sampleRegularRating: regularNetRatings[0],
          samplePlayoffRating: playoffNetRatings[0],
          rawAdvancedStats: advancedStats.data[0]
        });

        // Calculate averages
        regularNetRating = regularNetRatings.length > 0 
          ? regularNetRatings.reduce((sum, rating) => sum + rating.net_rating, 0) / regularNetRatings.length 
          : 0;

        playoffNetRating = playoffNetRatings.length > 0
          ? playoffNetRatings.reduce((sum, rating) => sum + rating.net_rating, 0) / playoffNetRatings.length
          : 0;

        console.log('Calculated net ratings:', {
          regularNetRating,
          playoffNetRating,
          regularCount: regularNetRatings.length,
          playoffCount: playoffNetRatings.length
        });

        // Use regular season net rating by default
        netRating = regularNetRating;
      }
    } catch (error) {
      console.error('Error fetching advanced stats:', {
        error: error.message,
        playerId: id,
        season: currentSeason,
        stack: error.stack
      });
      // Continue without advanced stats
    }

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
    today.setHours(0, 0, 0, 0); // Set to start of day

    // Filter games up to today's date and sort by most recent
    const recentGames = allGames
      .filter(g => {
        const gameDate = new Date(g.game.date);
        return gameDate <= today && g.game.status === 'Final';
      })
      .sort((a, b) => new Date(b.game.date) - new Date(a.game.date));

    // Filter regular season and playoff games
    const regularGames = recentGames
      .filter(g => g.game.postseason === false);

    const playoffGames = recentGames
      .filter(g => g.game.postseason === true);

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

    // Prepare recent games (last 5 of each type)
    const lastFiveRegularGames = regularGames.slice(0, 5);
    const lastFivePlayoffGames = playoffGames.slice(0, 5);
    const lastFiveGames = [...lastFiveRegularGames, ...lastFivePlayoffGames]
      .sort((a, b) => new Date(b.game.date) - new Date(a.game.date))
      .map(game => {
        const isPlayoff = game.game.postseason === true;
        console.log('Processing game:', {
          date: game.game.date,
          postseason: game.game.postseason,
          isPlayoff,
          team: game.team?.full_name,
          homeScore: game.game.home_team_score,
          visitorScore: game.game.visitor_team_score
        });
        
        // Safely determine the result and score
        const homeScore = game.game.home_team_score ?? 0;
        const visitorScore = game.game.visitor_team_score ?? 0;
        const isHomeTeam = game.game.home_team_id === game.team.id;
        const result = isHomeTeam 
          ? (homeScore > visitorScore ? 'W' : 'L')
          : (visitorScore > homeScore ? 'W' : 'L');
        
        // Find the matching NET rating by game ID and date
        const netRating = (() => {
          const ratings = game.game.postseason ? playoffNetRatings : regularNetRatings;
          const matchingRating = ratings.find(r => {
            const ratingDate = new Date(r.date);
            const gameDate = new Date(game.game.date);
            const sameDay = ratingDate.toDateString() === gameDate.toDateString();
            
            console.log('Matching NET rating for game:', {
              gameDate: game.game.date,
              ratingDate: r.date,
              gameMinutes: game.min,
              gameId: game.game.id,
              ratingGameId: r.game_id,
              sameDay,
              netRating: r.net_rating,
              availableRatings: ratings.map(r => ({
                date: r.date,
                netRating: r.net_rating,
                gameId: r.game_id
              }))
            });
            
            // Only match by date since game IDs might not match between APIs
            return sameDay;
          });
          
          if (!matchingRating) {
            console.log('No matching NET rating found for game:', {
              gameDate: game.game.date,
              gameId: game.game.id,
              minutes: game.min,
              isPlayoff: game.game.postseason,
              availableRatings: ratings.map(r => ({
                date: r.date,
                netRating: r.net_rating,
                gameId: r.game_id
              }))
            });
          }

          const rating = matchingRating?.net_rating ?? 0;
          console.log('Final NET rating for game:', {
            gameDate: game.game.date,
            gameId: game.game.id,
            rating,
            matchingRating
          });
          return rating;
        })();

        return {
          date: game.game.date,
          opponent: game.game.home_team_id === game.team.id ? game.game.visitor_team_id : game.game.home_team_id,
          points: game.pts || 0,
          rebounds: game.reb || 0,
          assists: game.ast || 0,
          minutes: game.min || '0',
          result,
          score: `${homeScore}-${visitorScore}`,
          isPlayoff,
          gameType: isPlayoff ? 'Playoff' : 'Regular Season',
          net_rating: netRating
        };
      });

    console.log('Final player data:', {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      team: player.team?.full_name,
      games: seasonAverages.games_played,
      regularGames: regularGames.length,
      playoffGames: playoffGames.length,
      firstRegularGame: regularGames[0] ? {
        date: regularGames[0].game.date,
        isPlayoff: regularGames[0].game.postseason,
        type: 'Regular Season'
      } : null,
      firstPlayoffGame: playoffGames[0] ? {
        date: playoffGames[0].game.date,
        isPlayoff: playoffGames[0].game.postseason,
        type: 'Playoff'
      } : null
    });

    // Prepare the response
    const response = {
      player: {
        ...player,
        regular_net_rating: regularNetRating ?? 0,
        playoff_net_rating: playoffNetRating ?? 0,
        regular_averages: regularAverages ?? { points: 0, rebounds: 0, assists: 0, games_played: 0 },
        playoff_averages: playoffAverages ?? { points: 0, rebounds: 0, assists: 0, games_played: 0 },
        regularNetRatings: regularNetRatings || [],
        recent_games: recentGames.map(game => {
          const homeScore = game.game.home_team_score ?? 0;
          const visitorScore = game.game.visitor_team_score ?? 0;
          const isHomeTeam = game.game.home_team_id === game.team.id;
          const result = isHomeTeam 
            ? (homeScore > visitorScore ? 'W' : 'L')
            : (visitorScore > homeScore ? 'W' : 'L');

          // Find the matching NET rating by game ID and date
          const netRating = (() => {
            const ratings = game.game.postseason ? playoffNetRatings : regularNetRatings;
            const matchingRating = ratings.find(r => {
              const ratingDate = new Date(r.date);
              const gameDate = new Date(game.game.date);
              const sameDay = ratingDate.toDateString() === gameDate.toDateString();
              
              console.log('Matching NET rating for game:', {
                gameDate: game.game.date,
                ratingDate: r.date,
                gameMinutes: game.min,
                gameId: game.game.id,
                ratingGameId: r.game_id,
                sameDay,
                netRating: r.net_rating,
                availableRatings: ratings.map(r => ({
                  date: r.date,
                  netRating: r.net_rating,
                  gameId: r.game_id
                }))
              });
              
              // Only match by date since game IDs might not match between APIs
              return sameDay;
            });
            
            if (!matchingRating) {
              console.log('No matching NET rating found for game:', {
                gameDate: game.game.date,
                gameId: game.game.id,
                minutes: game.min,
                isPlayoff: game.game.postseason,
                availableRatings: ratings.map(r => ({
                  date: r.date,
                  netRating: r.net_rating,
                  gameId: r.game_id
                }))
              });
            }

            const rating = matchingRating?.net_rating ?? 0;
            console.log('Final NET rating for game:', {
              gameDate: game.game.date,
              gameId: game.game.id,
              rating,
              matchingRating
            });
            return rating;
          })();

          return {
            date: game.game.date,
            isPlayoff: game.game.postseason,
            gameType: game.game.postseason ? 'Playoff' : 'Regular Season',
            result,
            score: `${homeScore}-${visitorScore}`,
            points: game.pts || 0,
            rebounds: game.reb || 0,
            assists: game.ast || 0,
            minutes: game.min || '0',
            net_rating: netRating
          };
        }) || []
      }
    };

    console.log('Final response:', {
      playerId: id,
      hasNetRating: !!response.player.regular_net_rating,
      regularNetRating: response.player.regular_net_rating,
      playoffNetRating: response.player.playoff_net_rating,
      recentGamesCount: response.player.recent_games.length,
      hasRegularAverages: !!response.player.regular_averages,
      hasPlayoffAverages: !!response.player.playoff_averages,
      regularNetRatingsCount: response.player.regularNetRatings.length,
      regularNetRatings: response.player.regularNetRatings
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in player API:', {
      message: error.message,
      stack: error.stack,
      playerId: id
    });
    
    return res.status(500).json({ error: 'Failed to load player data' });
  }
} 