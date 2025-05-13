const { initializeApi } = require('../../../lib/bdlClient');

// Error handler wrapper to ensure we never send HTML responses
const errorHandler = (res, status, error) => {
  // Ensure we're sending JSON
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
  }
  
  // Log the error for debugging
  console.error('API Error:', {
    status,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined
  });

  // Send a JSON response
  return res.status(status).json({
    error: error instanceof Error ? error.message : error,
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
      console.log('API initialized successfully');
    } catch (initError) {
      return errorHandler(res, 500, 'Failed to initialize API client');
    }

    // Fetch players
    let response;
    try {
      console.log('Fetching players with params:', { page, per_page, search: search || undefined });
      response = await apiInstance.nba.getPlayers({
        page: parseInt(page),
        per_page: parseInt(per_page),
        ...(search ? { search } : {})
      });
    } catch (apiError) {
      return errorHandler(res, 500, apiError);
    }

    // Validate response
    if (!response || !response.data) {
      return errorHandler(res, 500, 'Invalid API response format');
    }

    // Log success
    console.log('Players API response:', {
      status: 'success',
      totalPlayers: response.meta?.total_count,
      currentPage: response.meta?.current_page,
      playersReturned: response.data.length
    });

    const players = Array.isArray(response.data) ? response.data : [];

    // Handle empty results
    if (players.length === 0) {
      return res.status(200).json({ 
        data: [], 
        meta: {
          total_pages: response.meta?.total_pages || 0,
          current_page: parseInt(page),
          next_page: null
        }
      });
    }

    // Fetch advanced stats
    const ids = players.map(p => p.id);
    let advancedStats = { data: [] };
    
    try {
      const advancedStatsRes = await fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${ids.join(',')}&per_page=100`, {
        headers: {
          Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
        },
      });

      if (!advancedStatsRes.ok) {
        console.warn('Advanced stats fetch failed:', advancedStatsRes.status);
      } else {
        advancedStats = await advancedStatsRes.json();
      }
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
      meta: {
        total_pages: response.meta?.total_pages || 1,
        current_page: parseInt(page),
        next_page: parseInt(page) < (response.meta?.total_pages || 1) ? parseInt(page) + 1 : null
      }
    });
  } catch (error) {
    return errorHandler(res, 500, error);
  }
};

module.exports = handler; 