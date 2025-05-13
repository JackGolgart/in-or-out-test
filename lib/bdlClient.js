const { BalldontlieAPI } = require("@balldontlie/sdk");

let api = null;
let teamsCache = null;

const initializeApi = () => {
  if (api) return api;

  const apiKey = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY 
    : process.env.BALLDONTLIE_API_KEY;

  if (!apiKey) {
    console.error('Ball Don\'t Lie API key is not configured:', {
      env: process.env.NODE_ENV,
      isClient: typeof window !== 'undefined',
      hasKey: !!apiKey,
      envVars: Object.keys(process.env).filter(key => key.includes('BALL')),
    });
    throw new Error('Ball Don\'t Lie API key is not configured');
  }

  try {
    // Remove any 'Bearer ' prefix if present
    const cleanApiKey = apiKey.replace(/^Bearer\s+/i, '').trim();
    api = new BalldontlieAPI({ 
      apiKey: cleanApiKey,
      version: 'v1'  // Explicitly set API version to v1
    });
    return api;
  } catch (error) {
    console.error('Failed to initialize Ball Don\'t Lie API:', {
      error,
      hasKey: !!apiKey,
      keyLength: apiKey?.length,
    });
    throw error;
  }
};

const getTeams = async () => {
  try {
    // Return cached teams if available
    if (teamsCache) return teamsCache;

    const apiInstance = initializeApi();
    console.log('Fetching teams from API');
    
    const response = await apiInstance.nba.getTeams();
    
    if (!response || !response.data || !Array.isArray(response.data)) {
      console.error('Invalid teams response:', response);
      throw new Error('Invalid API response format');
    }

    // Cache the teams data
    teamsCache = response.data;
    return teamsCache;
  } catch (error) {
    console.error('Error fetching teams:', error);
    // Return empty array on error to prevent mapping issues
    return [];
  }
};

const getPlayers = async ({ page = 1, per_page = 25, search = '' }) => {
  try {
    const apiInstance = initializeApi();
    console.log('API initialized successfully');

    const params = {
      page: Math.max(1, parseInt(page)),
      per_page: Math.min(100, Math.max(1, parseInt(per_page))),
    };
    
    if (search && typeof search === 'string' && search.length >= 2) {
      params.search = search.trim();
    }

    console.log('Fetching players with params:', params);
    
    const response = await apiInstance.nba.getPlayers(params).catch(error => {
      console.error('SDK Error:', error);
      throw new Error(`SDK Error: ${error.message}`);
    });

    console.log('Players API response:', {
      status: 'success',
      totalPlayers: response.meta?.total_count,
      currentPage: response.meta?.current_page,
      playersReturned: response.data?.length
    });
    
    if (!response || !response.data) {
      throw new Error('Invalid API response format');
    }
    
    return response;
  } catch (error) {
    console.error('Error in getPlayers:', {
      message: error.message,
      stack: error.stack,
      params: { page, per_page, search }
    });
    throw error;
  }
};

const getPlayerStats = async (playerId) => {
  try {
    const apiInstance = initializeApi();
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
};

const getAdvancedStats = async (playerId, season = 2024) => {
  try {
    const apiInstance = initializeApi();
    console.log('API initialized successfully for advanced stats');

    if (!playerId || typeof playerId !== 'number') {
      throw new Error('Invalid player ID');
    }

    console.log('Fetching advanced stats for player:', { playerId, season });

    const response = await fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${playerId}&seasons[]=${season}&per_page=100`, {
      headers: {
        Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Advanced stats API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    console.log('Advanced stats API response:', {
      status: 'success',
      playerId,
      season,
      statsReturned: data.data?.length
    });

    if (!data || !data.data) {
      throw new Error('Invalid API response format');
    }

    return data;
  } catch (error) {
    console.error('Error in getAdvancedStats:', {
      message: error.message,
      stack: error.stack,
      playerId,
      season
    });
    throw error;
  }
};

module.exports = {
  initializeApi,
  getPlayers,
  getPlayerStats,
  getAdvancedStats,
  getTeams,
  default: {
    getPlayers,
    getPlayerStats,
    getAdvancedStats,
    getTeams,
  }
};
