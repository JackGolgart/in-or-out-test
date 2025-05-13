const { initializeApi } = require('../../../lib/bdlClient');

// Error handler wrapper to ensure we never send HTML responses
const errorHandler = (res, status, error) => {
  // Ensure we're sending JSON
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
  }
  
  // Format the error message
  let errorMessage;
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object') {
    try {
      errorMessage = JSON.stringify(error);
    } catch {
      errorMessage = 'Internal server error';
    }
  } else {
    errorMessage = 'Internal server error';
  }

  // Log the error for debugging
  console.error('API Error:', {
    status,
    error: errorMessage,
    originalError: error,
    stack: error instanceof Error ? error.stack : undefined
  });

  // Send a JSON response with a string error message
  return res.status(status).json({
    error: errorMessage,
    timestamp: new Date().toISOString()
  });
};

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  const year = today.getFullYear();
  
  // If we're in October or later, it's the season starting in that year
  // If we're in January through September, it's the season that started the previous year
  return month >= 10 ? year : year - 1;
}

async function fetchPlayerStats(api, playerId) {
  try {
    const currentSeason = getCurrentNBASeason();
    console.log(`Fetching stats for player ${playerId} for season ${currentSeason}`);
    
    // Fetch both regular stats and advanced stats
    const [regularStats, advancedStatsRes] = await Promise.all([
      api.nba.getPlayerStats({
        player_ids: [playerId],
        seasons: [currentSeason]
      }),
      fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${playerId}&seasons[]=${currentSeason}&per_page=100`, {
        headers: {
          Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
        },
      })
    ]);

    // Log the responses for debugging
    console.log('Regular stats response:', {
      hasData: !!regularStats?.data,
      dataLength: regularStats?.data?.length,
      firstPlayer: regularStats?.data?.[0]?.id
    });

    const advancedStats = await advancedStatsRes.json();
    console.log('Advanced stats response:', {
      hasData: !!advancedStats?.data,
      dataLength: advancedStats?.data?.length,
      firstPlayer: advancedStats?.data?.[0]?.player_id,
      netRating: advancedStats?.data?.[0]?.net_rating
    });

    if (!regularStats?.data?.[0]) {
      console.log('No regular stats found for player:', playerId);
      return null;
    }

    const playerStats = regularStats.data[0];
    const advancedStatsData = advancedStats.data?.[0];
    
    // Log the final stats object
    const stats = {
      net_rating: advancedStatsData?.net_rating || null,
      pts: playerStats.pts,
      reb: playerStats.reb,
      ast: playerStats.ast,
      games_played: playerStats.games_played,
      season: currentSeason
    };
    
    console.log('Final stats object:', {
      playerId,
      netRating: stats.net_rating,
      hasAdvancedStats: !!advancedStatsData
    });

    return stats;
  } catch (error) {
    console.error(`Error fetching stats for player ${playerId}:`, error);
    return null;
  }
}

const handler = async (req, res) => {
  // Force JSON content type
  res.setHeader('Content-Type', 'application/json');

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ status: 'ok' });
  }

  // Validate method
  if (req.method !== 'GET') {
    return errorHandler(res, 405, 'Method not allowed');
  }

  try {
    const { page = 1, per_page = 25, search = '' } = req.query;

    // Debug: Log environment variables
    console.log('Environment check:', {
      hasApiKey: !!process.env.BALLDONTLIE_API_KEY,
      apiKeyLength: process.env.BALLDONTLIE_API_KEY?.length,
      env: process.env.NODE_ENV,
      envVars: Object.keys(process.env).filter(key => key.includes('BALL'))
    });

    // Initialize API client
    let apiInstance;
    try {
      console.log('Initializing API client...');
      apiInstance = initializeApi();
      if (!apiInstance) {
        throw new Error('Failed to initialize API client');
      }
    } catch (initError) {
      console.error('API initialization error:', {
        error: initError,
        stack: initError.stack,
      });
      return errorHandler(res, 500, `Client initialization failed: ${initError.message}`);
    }

    // Use the SDK to fetch players
    const response = await apiInstance.nba.getPlayers({
      page: Math.max(1, parseInt(page)),
      per_page: Math.min(100, Math.max(1, parseInt(per_page))),
      ...(search && { search: search.trim() })
    }).catch(error => {
      console.error('SDK Error:', {
        error,
        stack: error.stack,
      });
      throw error;
    });

    if (!response || !response.data) {
      return errorHandler(res, 500, 'Invalid API response format');
    }

    const players = response.data;

    // Fetch stats for each player in parallel
    const playersWithStats = await Promise.all(
      players.map(async (player) => {
        try {
          const stats = await fetchPlayerStats(apiInstance, player.id);
          return {
            ...player,
            ...stats
          };
        } catch (error) {
          console.error(`Error fetching stats for player ${player.id}:`, error);
          return player;
        }
      })
    );

    // Validate the response data
    const validPlayers = playersWithStats.filter(player => 
      player && 
      typeof player === 'object' && 
      player.id && 
      player.first_name && 
      player.last_name && 
      player.team
    );

    if (validPlayers.length === 0) {
      console.error('No valid players found in response');
      return errorHandler(res, 500, 'No valid players found');
    }

    // Send final response
    return res.status(200).json({
      data: validPlayers,
      meta: response.meta
    });

  } catch (error) {
    console.error('Unhandled API error:', {
      message: error.message,
      stack: error.stack,
    });
    return errorHandler(res, 500, error.message || 'Failed to fetch players');
  }
};

export default handler; 