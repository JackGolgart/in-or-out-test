import { BalldontlieAPI } from "@balldontlie/sdk";

let api = null;
let apiV2 = null;
let teamsCache = null;

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  
  // NBA season starts in October (month 10)
  // If we're before October, use previous year as the season start
  return month < 10 ? year - 1 : year;
}

// Initialize API client with version
function initializeApi(version = 'v1') {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  
  if (!apiKey) {
    console.error('BALLDONTLIE_API_KEY is not set');
    throw new Error('BALLDONTLIE_API_KEY is not set');
  }

  console.log('Initializing BDL API ' + version + ':', {
    env: process.env.NODE_ENV,
    isClient: typeof window !== 'undefined',
    hasKey: !!apiKey,
    keyLength: apiKey.length,
    envVars: Object.keys(process.env).filter(key => key.includes('BALLDONTLIE')),
    version
  });

  try {
    return new BalldontlieAPI({
      apiKey,
      version
    });
  } catch (error) {
    console.error('Failed to initialize API:', error);
    throw error;
  }
}

// Get API client instance
export function getApiClient(version = 'v1') {
  return initializeApi(version);
}

// Get player data
export async function getPlayer(playerId) {
  try {
    const apiInstance = initializeApi();
    console.log('API initialized successfully for player');

    if (!playerId || typeof playerId !== 'number') {
      throw new Error('Invalid player ID');
    }

    console.log('Fetching player:', playerId);

    const response = await apiInstance.nba.getPlayer(playerId).catch(error => {
      console.error('SDK Error:', error);
      throw new Error(`SDK Error: ${error.message}`);
    });

    console.log('Player API response:', {
      status: 'success',
      playerId,
      hasData: !!response?.data
    });

    if (!response || !response.data) {
      throw new Error('Invalid API response format');
    }

    return response;
  } catch (error) {
    console.error('Error in getPlayer:', {
      message: error.message,
      stack: error.stack,
      playerId
    });
    throw error;
  }
}

// Get players with search
export async function getPlayers({ page = 1, per_page = 25, search = '', player_ids = [] }) {
  try {
    // Use v1 for basic player information
    const apiInstance = initializeApi('v1');
    console.log('API initialized successfully for player search');

    const params = {};
    
    // Only use pagination if we're not looking up specific players
    if (!player_ids || player_ids.length === 0) {
      params.page = Math.max(1, parseInt(page));
      params.per_page = Math.min(100, Math.max(1, parseInt(per_page)));
    }
    
    if (search && typeof search === 'string' && search.length >= 1) {
      // Clean and format the search query
      const cleanSearch = search.trim();
      
      // Try different search formats
      if (cleanSearch.includes(' ')) {
        const [firstName, lastName] = cleanSearch.split(' ');
        // Try both formats: "firstName lastName" and "lastName, firstName"
        params.search = `${firstName} ${lastName}`;
        console.log('Searching with full name formats:', {
          format1: params.search,
          format2: `${lastName}, ${firstName}`,
          original: cleanSearch
        });
      } else {
        params.search = cleanSearch;
        console.log('Searching with single term:', cleanSearch);
      }
      
      console.log('Search parameters:', {
        search: params.search,
        isFullName: cleanSearch.includes(' '),
        page: params.page,
        perPage: params.per_page,
        playerIds: player_ids
      });
    }

    if (player_ids && player_ids.length > 0) {
      params.player_ids = player_ids.map(id => parseInt(id));
    }

    console.log('Fetching players with params:', params);
    const response = await apiInstance.nba.getPlayers(params);

    console.log('Players API response:', {
      status: 'success',
      totalPlayers: response?.data?.length,
      firstPlayer: response?.data?.[0] ? {
        id: response.data[0].id,
        name: `${response.data[0].first_name} ${response.data[0].last_name}`,
        team: response.data[0].team?.full_name
      } : null
    });

    return response;
  } catch (error) {
    console.error('Error in getPlayers:', {
      message: error.message,
      stack: error.stack,
      search,
      page,
      per_page,
      player_ids
    });
    throw error;
  }
}

// Get player stats
export async function getPlayerStats(playerId) {
  try {
    // Use v2 for more detailed stats
    const apiInstance = initializeApi('v2');
    console.log('API initialized successfully for player stats');

    if (!playerId || typeof playerId !== 'number') {
      throw new Error('Invalid player ID');
    }

    console.log('Fetching stats for player:', playerId);

    const response = await apiInstance.nba.getPlayerStats({ 
      player_ids: [playerId] 
    }).catch(error => {
      console.error('SDK Error:', error);
      throw new Error(`SDK Error: ${error.message}`);
    });

    console.log('Player stats API response:', {
      status: 'success',
      playerId,
      statsReturned: response.data?.length
    });

    if (!response || !response.data) {
      throw new Error('Invalid API response format');
    }

    return response;
  } catch (error) {
    console.error('Error in getPlayerStats:', {
      message: error.message,
      stack: error.stack,
      playerId
    });
    throw error;
  }
}

// Get advanced stats
export async function getAdvancedStats(playerId, season = getCurrentNBASeason()) {
  try {
    console.log('Starting getAdvancedStats with:', { playerId, season });
    
    const apiInstance = initializeApi('v1');
    console.log('API initialized successfully for advanced stats');

    if (!playerId || typeof playerId !== 'number') {
      throw new Error('Invalid player ID');
    }

    const sanitizedSeason = Number(season);
    if (isNaN(sanitizedSeason) || sanitizedSeason < 1946 || sanitizedSeason > new Date().getFullYear()) {
      throw new Error('Invalid season');
    }

    console.log('Fetching advanced stats:', {
      playerId,
      season: sanitizedSeason,
      env: process.env.NODE_ENV
    });

    // First get the player's stats for the season
    let statsResponse;
    try {
      statsResponse = await apiInstance.nba.getStats({
        player_ids: [playerId],
        seasons: [sanitizedSeason],
        per_page: 100
      });
      
      console.log('Stats API response:', {
        status: 'success',
        hasData: !!statsResponse?.data,
        dataLength: statsResponse?.data?.length,
        firstStat: statsResponse?.data?.[0] ? {
          player_id: statsResponse.data[0].player_id,
          game_id: statsResponse.data[0].game_id,
          min: statsResponse.data[0].min,
          date: statsResponse.data[0].game?.date
        } : null
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }

    if (!statsResponse || !statsResponse.data) {
      console.error('Invalid stats response:', statsResponse);
      throw new Error('Invalid API response format');
    }

    // Filter out any stats where the player didn't play
    const filteredData = statsResponse.data.filter(stat => {
      if (!stat || typeof stat !== 'object') {
        console.log('Invalid stat object:', stat);
        return false;
      }

      const minutes = stat.min;
      const hasPlayed = minutes && minutes !== '00' && minutes !== '0';
      const hasValidGame = stat.game && typeof stat.game === 'object' && stat.game.date;
      
      console.log('Filtering stat:', {
        date: stat.game?.date,
        gameId: stat.game_id,
        minutes,
        hasPlayed,
        hasValidGame
      });
      
      return hasPlayed && hasValidGame;
    });

    console.log('Filtered stats:', {
      totalStats: statsResponse.data.length,
      filteredStats: filteredData.length,
      sampleStats: filteredData.slice(0, 3)
    });

    // Get all advanced stats for the season in one call
    let advancedStats;
    try {
      const advancedStatsResponse = await fetch(
        `https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${playerId}&seasons[]=${sanitizedSeason}&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
          },
        }
      );

      if (!advancedStatsResponse.ok) {
        throw new Error(`Advanced stats API returned ${advancedStatsResponse.status}`);
      }

      advancedStats = await advancedStatsResponse.json();
      
      console.log('Advanced stats response:', {
        hasData: !!advancedStats?.data,
        dataLength: advancedStats?.data?.length,
        firstStat: advancedStats?.data?.[0]
      });
    } catch (error) {
      console.error('Error fetching advanced stats:', error);
      throw new Error(`Failed to fetch advanced stats: ${error.message}`);
    }

    // Create a map of game IDs to advanced stats
    const advancedStatsMap = new Map();
    if (advancedStats?.data) {
      advancedStats.data.forEach(stat => {
        const gameId = stat.game_id || stat.game?.id;
        const netRating = stat.net_rating;
        
        console.log('Processing advanced stat:', {
          gameId,
          netRating,
          rawStat: stat
        });

        if (gameId && netRating !== undefined && netRating !== null) {
          const rating = Number(netRating);
          if (!isNaN(rating) && rating >= -100 && rating <= 100) {
            advancedStatsMap.set(gameId, {
              ...stat,
              net_rating: rating
            });
            
            console.log('Added to advanced stats map:', {
              gameId,
              netRating: rating
            });
          }
        }
      });
    }

    console.log('Advanced stats map:', {
      size: advancedStatsMap.size,
      keys: Array.from(advancedStatsMap.keys()),
      sampleValues: Array.from(advancedStatsMap.entries()).slice(0, 3)
    });

    // Process NET ratings
    const regularNetRatings = [];
    const playoffNetRatings = [];

    for (const stat of filteredData) {
      const gameId = stat.game_id || stat.game?.id;
      const advancedStat = advancedStatsMap.get(gameId);
      
      console.log('Processing game:', {
        gameId,
        date: stat.game?.date,
        hasAdvancedStat: !!advancedStat
      });

      if (advancedStat) {
        const netRating = Number(advancedStat.net_rating);
        if (!isNaN(netRating) && netRating >= -100 && netRating <= 100) {
          const gameDate = new Date(stat.game.date);
          const utcDate = new Date(Date.UTC(
            gameDate.getUTCFullYear(),
            gameDate.getUTCMonth(),
            gameDate.getUTCDate()
          ));

          const rating = {
            date: utcDate.toISOString(),
            game_id: gameId,
            net_rating: netRating,
            is_playoff: Boolean(stat.game?.postseason)
          };

          console.log('Found NET rating:', {
            date: rating.date,
            gameId: rating.game_id,
            netRating: rating.net_rating,
            isPlayoff: rating.is_playoff
          });

          if (rating.is_playoff) {
            playoffNetRatings.push(rating);
          } else {
            regularNetRatings.push(rating);
          }
        }
      }
    }

    // Calculate average NET ratings with validation
    const calculateAverage = (ratings) => {
      if (!ratings.length) return 0;
      
      const validRatings = ratings.filter(r => 
        typeof r.net_rating === 'number' && 
        !isNaN(r.net_rating) &&
        r.net_rating >= -100 &&
        r.net_rating <= 100
      );
      
      if (!validRatings.length) return 0;
      
      const sum = validRatings.reduce((acc, r) => acc + r.net_rating, 0);
      return Number((sum / validRatings.length).toFixed(1));
    };

    const regularNetRating = calculateAverage(regularNetRatings);
    const playoffNetRating = calculateAverage(playoffNetRatings);

    console.log('Final NET ratings:', {
      regularCount: regularNetRatings.length,
      playoffCount: playoffNetRatings.length,
      regularNetRating,
      playoffNetRating,
      sampleRegularRatings: regularNetRatings.slice(0, 3),
      samplePlayoffRatings: playoffNetRatings.slice(0, 3)
    });

    return {
      regularNetRatings,
      playoffNetRatings,
      regularNetRating,
      playoffNetRating
    };
  } catch (error) {
    console.error('Error in getAdvancedStats:', {
      message: error.message,
      stack: error.stack,
      playerId,
      season
    });
    throw new Error('Failed to fetch advanced stats');
  }
}

// Get teams
export async function getTeams() {
  try {
    const apiInstance = initializeApi();
    console.log('Fetching teams from API');
    
    const response = await apiInstance.nba.getTeams();
    
    if (!response || !response.data) {
      throw new Error('Invalid API response format');
    }

    return response.data;
  } catch (error) {
    console.error('Error in getTeams:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}
