import { supabase } from './supabase';

const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const CACHE_VERSION = 1;

export async function getPlayerFromCache(playerId) {
  try {
    const { data: cached, error } = await supabase
      .from('player_cache')
      .select('*')
      .eq('player_id', playerId)
      .eq('cache_version', CACHE_VERSION)
      .maybeSingle();

    if (error) throw error;

    const isFresh = cached?.updated_at && 
      Date.now() - new Date(cached.updated_at).getTime() < CACHE_DURATION;

    if (isFresh) {
      return {
        player: cached.player,
        advancedStats: cached.advanced_stats,
        seasonAverages: cached.season_averages,
        isCached: true
      };
    }

    return null;
  } catch (err) {
    console.error('Cache read error:', err);
    return null;
  }
}

export async function updatePlayerCache(playerId, data) {
  try {
    const { error } = await supabase.from('player_cache').upsert({
      player_id: playerId,
      player: data.player,
      advanced_stats: data.advancedStats,
      season_averages: data.seasonAverages,
      updated_at: new Date().toISOString(),
      cache_version: CACHE_VERSION
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Cache update error:', err);
    return false;
  }
}

export async function invalidatePlayerCache(playerId) {
  try {
    const { error } = await supabase
      .from('player_cache')
      .delete()
      .eq('player_id', playerId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Cache invalidation error:', err);
    return false;
  }
}

export async function batchUpdatePlayerCache(players) {
  try {
    const batchData = players.map(player => ({
      player_id: player.id,
      player: player.playerData,
      advanced_stats: player.advancedStats,
      season_averages: player.seasonAverages,
      updated_at: new Date().toISOString(),
      cache_version: CACHE_VERSION
    }));

    const { error } = await supabase
      .from('player_cache')
      .upsert(batchData);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Batch cache update error:', err);
    return false;
  }
}

export async function cleanupOldCache() {
  try {
    const oneHourAgo = new Date(Date.now() - CACHE_DURATION).toISOString();
    
    const { error } = await supabase
      .from('player_cache')
      .delete()
      .or(`updated_at.lt.${oneHourAgo},cache_version.neq.${CACHE_VERSION}`);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Cache cleanup error:', err);
    return false;
  }
} 