import { BalldontlieAPI } from "@balldontlie/sdk";

let api = null;
let apiV2 = null;
let teamsCache = null;

// Function to get current NBA season
function getCurrentNBASeason() {
  // For the 2024-2025 season, we'll use 2024 as the season year
  return 2024;
}

// Initialize API client with version
function initializeApi(version = 'v1') {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  
  if (!apiKey) {
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

  return new BalldontlieAPI({
    apiKey,
    version
  });
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

// Export all functions
export {
  getApiClient,
  getPlayer,
  getPlayers,
  getPlayerStats,
  getAdvancedStats,
  getTeams
};
