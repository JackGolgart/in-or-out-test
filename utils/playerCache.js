import { trackCacheOperation } from './performance';

const CACHE_VERSION = 1;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

class PlayerCacheError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'PlayerCacheError';
    this.code = code;
  }
}

export class PlayerCache {
  constructor() {
    this.cache = new Map();
  }

  validatePlayerData(data) {
    if (!data || typeof data !== 'object') {
      throw new PlayerCacheError('Invalid player data format', 'INVALID_FORMAT');
    }

    const requiredFields = ['id', 'firstName', 'lastName', 'team'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new PlayerCacheError(`Missing required field: ${field}`, 'MISSING_FIELD');
      }
    }

    if ('net_rating' in data && typeof data.net_rating !== 'number') {
      throw new PlayerCacheError('Invalid NET rating format', 'INVALID_NET_RATING');
    }
  }

  async get(playerId) {
    try {
      const cacheEntry = this.cache.get(playerId);
      
      if (!cacheEntry) {
        trackCacheOperation(false);
        return null;
      }

      const { data, timestamp, version } = cacheEntry;
      const isExpired = Date.now() - timestamp > CACHE_DURATION;
      const isOutdated = version !== CACHE_VERSION;

      if (isExpired || isOutdated) {
        this.cache.delete(playerId);
        trackCacheOperation(false);
        return null;
      }

      trackCacheOperation(true);
      return data;
    } catch (error) {
      console.error('Cache read error:', error);
      throw new PlayerCacheError('Failed to read from cache', 'READ_ERROR');
    }
  }

  async set(playerId, data) {
    try {
      this.validatePlayerData(data);
      
      this.cache.set(playerId, {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      });

      // Clean up expired entries periodically
      if (Math.random() < 0.1) { // 10% chance to trigger cleanup
        this.cleanup();
      }
    } catch (error) {
      console.error('Cache write error:', error);
      throw new PlayerCacheError('Failed to write to cache', 'WRITE_ERROR');
    }
  }

  async cleanup() {
    try {
      const now = Date.now();
      for (const [playerId, entry] of this.cache.entries()) {
        if (now - entry.timestamp > CACHE_DURATION || entry.version !== CACHE_VERSION) {
          this.cache.delete(playerId);
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  async clear() {
    try {
      this.cache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
      throw new PlayerCacheError('Failed to clear cache', 'CLEAR_ERROR');
    }
  }

  async getStats() {
    return {
      size: this.cache.size,
      version: CACHE_VERSION,
      oldestEntry: Math.min(...Array.from(this.cache.values()).map(entry => entry.timestamp)),
      newestEntry: Math.max(...Array.from(this.cache.values()).map(entry => entry.timestamp))
    };
  }
}

export const playerCache = new PlayerCache(); 