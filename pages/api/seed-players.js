const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  
  // NBA season starts in October (month 10)
  // If we're before October, use previous year as the season start
  return month < 10 ? year - 1 : year;
}

async function fetchPlayerAdvancedStats(playerId, season = getCurrentNBASeason()) {
  const res = await fetch(`https://api.balldontlie.io/v1/stats/advanced?player_ids[]=${playerId}&seasons[]=${season}&per_page=100`);
  const json = await res.json();
  return json.data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { playerIds = [] } = req.body;

  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    return res.status(400).json({ error: 'playerIds must be a non-empty array' });
  }

  const inserted = [];

  for (const id of playerIds) {
    try {
      const advancedStats = await fetchPlayerAdvancedStats(id);
      const netRating = advancedStats.length > 0 ? advancedStats[0].net_rating : null;
      const playerRes = await fetch(`https://www.balldontlie.io/api/v1/players/${id}`);
      const player = await playerRes.json();

      const { error } = await supabase.from('players').upsert({
        id: id,
        first_name: player.first_name,
        last_name: player.last_name,
        team: player.team.full_name,
        position: player.position,
        net_rating: netRating,
      });

      if (error) throw error;
      inserted.push({ 
        name: `${player.first_name} ${player.last_name}`, 
        net_rating: netRating?.toFixed(2) || 'N/A' 
      });
    } catch (err) {
      console.error(`Failed for player ID ${id}:`, err.message);
    }
  }

  res.status(200).json({ success: true, inserted });
}
