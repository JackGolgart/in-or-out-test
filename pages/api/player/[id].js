import { supabase } from '../../../lib/supabase';
import api from '../../../lib/bdlClient';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'Missing player ID' });

  try {
    // Check Supabase cache
    const { data: cached, error } = await supabase
      .from('player_cache')
      .select('*')
      .eq('player_id', id)
      .maybeSingle();

    const isFresh = cached?.updated_at && Date.now() - new Date(cached.updated_at).getTime() < 86400000;

    if (isFresh) {
      return res.status(200).json({
        player: cached.player,
        seasonAverages: cached.season_averages,
      });
    }

    // Fetch player directly by ID
    const resPlayer = await fetch(`https://api.balldontlie.io/v1/players/${id}`, {
      headers: {
        Authorization: `Bearer c81d57c3-85f8-40f2-ad5b-0c268c0220a0`,
      },
    });

    const player = await resPlayer.json();
    if (!player || !player.id) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Fetch season averages
    const averages = await api.nba.getSeasonAverages({
      player_ids: [parseInt(id)],
      season: 2023,
    });

    const seasonAverages = averages.data.length > 0 ? averages.data[0] : null;

    // Cache in Supabase
    await supabase.from('player_cache').upsert({
      player_id: player.id,
      player,
      season_averages: seasonAverages,
      updated_at: new Date().toISOString(),
    });

    res.status(200).json({ player, seasonAverages });
  } catch (err) {
    console.error('API Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
