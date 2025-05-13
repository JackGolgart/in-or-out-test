import { BalldontlieAPI } from "@balldontlie/sdk";

let api = null;

const initializeApi = () => {
  if (api) return api;

  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) {
    throw new Error('BALLDONTLIE_API_KEY environment variable is not set');
  }

  try {
    api = new BalldontlieAPI({ apiKey });
    return api;
  } catch (error) {
    console.error('Failed to initialize Ball Don\'t Lie API:', error);
    throw error;
  }
};

export const getPlayers = async ({ page = 1, per_page = 25, search = '' }) => {
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
    
    const response = await apiInstance.nba.getPlayers(params);
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

export const getPlayerStats = async (playerId) => {
  try {
    const apiInstance = initializeApi();
    console.log('API initialized successfully for player stats');

    if (!playerId || typeof playerId !== 'number') {
      throw new Error('Invalid player ID');
    }

    console.log('Fetching stats for player:', playerId);

    const response = await apiInstance.nba.getPlayerStats({ 
      player_ids: [playerId] 
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

export const getAdvancedStats = async (playerId, season = 2024) => {
  try {
    const apiInstance = initializeApi();
    console.log('API initialized successfully for advanced stats');

    if (!playerId || typeof playerId !== 'number') {
      throw new Error('Invalid player ID');
    }

    console.log('Fetching advanced stats for player:', { playerId, season });

    const response = await apiInstance.nba.getAdvancedStats({ 
      player_ids: [playerId],
      seasons: [parseInt(season)]
    });

    console.log('Advanced stats API response:', {
      status: 'success',
      playerId,
      season,
      statsReturned: response.data?.length
    });

    if (!response || !response.data) {
      throw new Error('Invalid API response format');
    }

    return response;
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

export default {
  getPlayers,
  getPlayerStats,
  getAdvancedStats,
};
