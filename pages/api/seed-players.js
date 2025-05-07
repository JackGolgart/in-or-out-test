const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ofyxpiqpcomlxfdyswkv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9meXhwaXFwY29tbHhmZHlzd2t2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTk1NDgxOCwiZXhwIjoyMDYxNTMwODE4fQ.QqvGLhazUEJUHqoln81fZRWqqEFfAcCyrIM4YX5CWek'
);

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function fetchPlayerStats(playerId, season = 2023) {
  const res = await fetch(`https://www.balldontlie.io/api/v1/stats?player_ids[]=${playerId}&seasons[]=${season}&per_page=100`);
  const json = await res.json();
  return json.data;
}

function calculatePER(stats) {
  let totalPTS = 0, totalREB = 0, totalAST = 0, totalSTL = 0, totalBLK = 0;
  let missedFG = 0, missedFT = 0, totalTO = 0, gamesPlayed = stats.length;

  stats.forEach(game => {
    totalPTS += game.pts;
    totalREB += game.reb;
    totalAST += game.ast;
    totalSTL += game.stl;
    totalBLK += game.blk;
    missedFG += (game.fga - game.fgm);
    missedFT += (game.fta - game.ftm);
    totalTO += game.turnover;
  });

  return gamesPlayed
    ? (totalPTS + totalREB + totalAST + totalSTL + totalBLK - missedFG - missedFT - totalTO) / gamesPlayed
    : 0;
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
      const stats = await fetchPlayerStats(id);
      const per = calculatePER(stats);
      const playerRes = await fetch(`https://www.balldontlie.io/api/v1/players/${id}`);
      const player = await playerRes.json();

      const { error } = await supabase.from('players').upsert({
        id: id,
        first_name: player.first_name,
        last_name: player.last_name,
        team: player.team.full_name,
        position: player.position,
        current_per: per,
      });

      if (error) throw error;
      inserted.push({ name: `${player.first_name} ${player.last_name}`, per: per.toFixed(2) });
    } catch (err) {
      console.error(`Failed for player ID ${id}:`, err.message);
    }
  }

  res.status(200).json({ success: true, inserted });
}
