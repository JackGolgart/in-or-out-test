const { BalldontlieAPI } = require("@balldontlie/sdk");

let api = null;
let apiV2 = null;
let teamsCache = null;

const initializeApi = (version = 'v1') => {
  if (version === 'v1' && api) return api;
  if (version === 'v2' && apiV2) return apiV2;

  const apiKey = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY 
    : process.env.BALLDONTLIE_API_KEY;

  console.log(`Initializing BDL API ${version}:`, {
    env: process.env.NODE_ENV,
    isClient: typeof window !== 'undefined',
    hasKey: !!apiKey,
    keyLength: apiKey?.length,
    envVars: Object.keys(process.env).filter(key => key.includes('BALL')),
    version
  });

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
    const newApi = new BalldontlieAPI({ 
      apiKey: cleanApiKey,
      version
    });
    
    if (version === 'v1') {
      api = newApi;
    } else {
      apiV2 = newApi;
    }
    
    return newApi;
  } catch (error) {
    console.error(`Failed to initialize Ball Don't Lie API ${version}:`, {
      error,
      hasKey: !!apiKey,
      keyLength: apiKey?.length,
      env: process.env.NODE_ENV,
      isClient: typeof window !== 'undefined'
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

const getPlayer = async (playerId) => {
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
};

const getPlayers = async ({ page = 1, per_page = 25, search = '', player_ids = [] }) => {
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
      params.search = cleanSearch;
      
      console.log('Search parameters:', {
        search: cleanSearch,
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
    
    const response = await apiInstance.nba.getPlayers(params).catch(error => {
      console.error('SDK Error:', {
        error,
        message: error.message,
        searchParams: params
      });
      throw new Error(`SDK Error: ${error.message}`);
    });

    console.log('Players API response:', {
      status: 'success',
      totalPlayers: response.meta?.total_count,
      currentPage: response.meta?.current_page,
      playersReturned: response.data?.length,
      params,
      firstPlayer: response.data?.[0] ? {
        id: response.data[0].id,
        name: `${response.data[0].first_name} ${response.data[0].last_name}`,
        team: response.data[0].team?.full_name
      } : null,
      searchTerm: search,
      playerIds: player_ids
    });
    
    if (!response || !response.data) {
      console.error('Invalid API response format:', {
        response,
        searchParams: params
      });
      throw new Error('Invalid API response format');
    }
    
    return response;
  } catch (error) {
    console.error('Error in getPlayers:', {
      message: error.message,
      stack: error.stack,
      params: { page, per_page, search, player_ids }
    });
    throw error;
  }
};

const getPlayerStats = async (playerId) => {
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
};

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  
  // NBA season starts in October (month 10)
  // If we're before October, use previous year as the season start
  return month < 10 ? year - 1 : year;
}

const getAdvancedStats = async (playerId, season = getCurrentNBASeason()) => {
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
  getPlayer,
  getPlayerStats,
  getAdvancedStats,
  getTeams,
  default: {
    getPlayers,
    getPlayer,
    getPlayerStats,
    getAdvancedStats,
    getTeams,
  }
};
