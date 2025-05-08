import api from '../../../lib/bdlClient';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing player ID' });

  try {
    const { data: cached, error: cacheError } = await supabase
      .from('player_cache')
      .select('*')
      .eq('player_id', id)
      .maybeSingle();

    const isFresh = cached && cached.updated_at && Date.now() - new Date(cached.updated_at).getTime() < 86400000;

    if (isFresh) {
      return res.status(200).json({
        player: cached.player,
        seasonAverages: cached.season_averages,
      });
    }

    const playerRes = await api.nba.getPlayers({ search: id });
    const player = playerRes.data.find(p => String(p.id) === id);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const averages = await api.nba.getSeasonAverages({
      player_ids: [parseInt(id)],
      season: 2023,
    });

    const seasonAverages = averages.data.length > 0 ? averages.data[0] : null;

    await supabase.from('player_cache').upsert({
      player_id: player.id,
      player,
      season_averages: seasonAverages,
      updated_at: new Date().toISOString(),
    });

    res.status(200).json({ player, seasonAverages });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}
