const { initializeApi } = require('../../../lib/bdlClient');

const handler = async (req, res) => {
  // Ensure we always send JSON responses, even in case of errors
  res.setHeader('Content-Type', 'application/json');

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ status: 'ok' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page = 1, per_page = 25, search = '' } = req.query;

    console.log('API Request:', {
      method: req.method,
      query: req.query,
      headers: req.headers,
      env: {
        hasApiKey: !!process.env.BALLDONTLIE_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });

    // Check if API key is set
    if (!process.env.BALLDONTLIE_API_KEY) {
      console.error('BALLDONTLIE_API_KEY is not set in environment variables');
      return res.status(500).json({
        error: 'API configuration error',
        details: 'API key is not configured',
        env: process.env.NODE_ENV
      });
    }

    console.log('Initializing API client...');
    let apiInstance;
    try {
      apiInstance = initializeApi();
      console.log('API initialized successfully');
    } catch (initError) {
      console.error('Failed to initialize API:', initError);
      return res.status(500).json({
        error: 'API initialization failed',
        details: initError.message
      });
    }

    console.log('Fetching players with params:', { page, per_page, search: search || undefined });

    let response;
    try {
      response = await apiInstance.nba.getPlayers({
        page: parseInt(page),
        per_page: parseInt(per_page),
        ...(search ? { search } : {})
      });
    } catch (apiError) {
      console.error('NBA API request failed:', {
        message: apiError.message,
        status: apiError.status,
        response: apiError.response
      });
      return res.status(500).json({
        error: 'NBA API request failed',
        details: apiError.message,
        params: { page, per_page, search }
      });
    }

    if (!response || !response.data) {
      console.error('Invalid API response:', response);
      return res.status(500).json({
        error: 'Invalid API response format',
        details: 'Response missing data property'
      });
    }

    console.log('Players API response:', {
      status: 'success',
      totalPlayers: response.meta?.total_count,
      currentPage: response.meta?.current_page,
      playersReturned: response.data.length
    });

    const players = Array.isArray(response.data) ? response.data : [];

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

    // Fetch advanced stats for NET rating
    const ids = players.map(p => p.id);
    let advancedStats = { data: [] };
    
    try {
      const advancedStatsRes = await fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${ids.join(',')}&per_page=100`, {
        headers: {
          Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
        },
      });

      if (!advancedStatsRes.ok) {
        console.error('Advanced stats fetch failed:', advancedStatsRes.status);
        // Don't throw, just log and continue with null net_ratings
      } else {
        advancedStats = await advancedStatsRes.json();
      }
    } catch (statsError) {
      console.error('Error fetching advanced stats:', statsError);
      // Don't throw, just log and continue with null net_ratings
    }

    const playersWithNetRating = players.map(player => {
      const stats = advancedStats.data?.find(stat => stat.player_id === player.id);
      return {
        ...player,
        net_rating: stats?.net_rating ?? null,
      };
    });

    // Log successful response
    console.log('API Response success:', {
      total: response.meta?.total_count,
      current_page: response.meta?.current_page,
      per_page: response.meta?.per_page,
      players_with_ratings: playersWithNetRating.length
    });

    return res.status(200).json({
      data: playersWithNetRating,
      meta: {
        total_pages: response.meta?.total_pages || 1,
        current_page: parseInt(page),
        next_page: parseInt(page) < (response.meta?.total_pages || 1) ? parseInt(page) + 1 : null
      }
    });
  } catch (error) {
    // Catch any unexpected errors and ensure we return valid JSON
    console.error('Unexpected error in players API:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      type: error.name,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = handler; 