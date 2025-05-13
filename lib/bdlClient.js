import { BalldontlieAPI } from "@balldontlie/sdk";
import config from './config';

// Only initialize the API client on the server side
const api = config.isServer ? new BalldontlieAPI({ apiKey: config.balldontlie.apiKey }) : null;

// Helper function to ensure server-side execution
const ensureServerSide = () => {
  if (!config.isServer) {
    throw new Error('This function must be called from the server side');
  }
};

export const getPlayers = async ({ page = 1, per_page = 25, search = '' }) => {
  ensureServerSide();
  
  try {
    if (!api) {
      throw new Error('API client not initialized');
    }

    const params = {
      page: Math.max(1, parseInt(page)),
      per_page: Math.min(100, Math.max(1, parseInt(per_page))),
    };
    
    if (search && typeof search === 'string' && search.length >= 2) {
      params.search = search.trim();
    }
    
    const response = await api.nba.getPlayers(params);
    
    if (!response || !response.data) {
      throw new Error('Invalid API response format');
    }
    
    return response;
  } catch (error) {
    console.error('Error in getPlayers:', error);
    throw error;
  }
};

export const getPlayerStats = async (playerId) => {
  ensureServerSide();

  try {
    if (!api) {
      throw new Error('API client not initialized');
    }

    if (!playerId || typeof playerId !== 'number') {
      throw new Error('Invalid player ID');
    }

    const response = await api.nba.getPlayerStats({ 
      player_ids: [playerId] 
    });

    if (!response || !response.data) {
      throw new Error('Invalid API response format');
    }

    return response;
  } catch (error) {
    console.error('Error in getPlayerStats:', error);
    throw error;
  }
};

export const getAdvancedStats = async (playerId, season = 2024) => {
  ensureServerSide();

  try {
    if (!api) {
      throw new Error('API client not initialized');
    }

    if (!playerId || typeof playerId !== 'number') {
      throw new Error('Invalid player ID');
    }

    const response = await api.nba.getAdvancedStats({ 
      player_ids: [playerId],
      seasons: [parseInt(season)]
    });

    if (!response || !response.data) {
      throw new Error('Invalid API response format');
    }

    return response;
  } catch (error) {
    console.error('Error in getAdvancedStats:', error);
    throw error;
  }
};

export default {
  getPlayers,
  getPlayerStats,
  getAdvancedStats,
};
