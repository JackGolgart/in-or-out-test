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

    // Log request details
    console.log('API Request:', {
      method: req.method,
      query: req.query,
      headers: req.headers,
      env: {
        hasApiKey: !!process.env.BALLDONTLIE_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });

    // Validate API key
    if (!process.env.BALLDONTLIE_API_KEY) {
      return errorHandler(res, 500, 'API key not configured');
    }

    // Initialize API client
    let apiInstance;
    try {
      console.log('Initializing API client...');
      apiInstance = initializeApi();
      if (!apiInstance) {
        throw new Error('Failed to initialize API client');
      }
    } catch (initError) {
      console.error('API initialization error:', initError);
      return errorHandler(res, 500, 'Failed to initialize API client');
    }

    // Fetch players
    const response = await apiInstance.nba.getPlayers({
      page: Math.max(1, parseInt(page)),
      per_page: Math.min(100, Math.max(1, parseInt(per_page))),
      search: search && typeof search === 'string' ? search.trim() : ''
    });

    if (!response || !response.data) {
      return errorHandler(res, 500, 'Invalid API response format');
    }

    const players = response.data;

    // Fetch advanced stats for all players
    let advancedStats = { data: [] };
    try {
      const advancedStatsRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/player_stats?select=player_id,net_rating`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!advancedStatsRes.ok) {
        throw new Error(`Failed to fetch advanced stats: ${advancedStatsRes.statusText}`);
      }

      advancedStats = await advancedStatsRes.json();
    } catch (statsError) {
      console.warn('Error fetching advanced stats:', statsError);
    }

    // Combine player data with advanced stats
    const playersWithNetRating = players.map(player => {
      const stats = advancedStats.data?.find(stat => stat.player_id === player.id);
      return {
        ...player,
        net_rating: stats?.net_rating ?? null,
      };
    });

    // Log success
    console.log('API Response success:', {
      total: response.meta?.total_count,
      current_page: response.meta?.current_page,
      per_page: response.meta?.per_page,
      players_with_ratings: playersWithNetRating.length
    });

    // Send final response
    return res.status(200).json({
      data: playersWithNetRating,
      meta: response.meta
    });

  } catch (error) {
    console.error('Unhandled API error:', error);
    return errorHandler(res, 500, error);
  }
};

export default handler; 