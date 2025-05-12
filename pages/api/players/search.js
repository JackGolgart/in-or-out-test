import api from '../../../lib/bdlClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, team, page = 1, per_page = 12 } = req.query;

  try {
    const options = {
      per_page,
      page: parseInt(page),
    };

    if (query && query.length > 2) {
      options.search = query;
    }

    if (team) {
      options.team_ids = [parseInt(team)];
    }

    const response = await api.nba.getPlayers(options);
    const players = Array.isArray(response.data) ? response.data : [];

    if (players.length === 0) {
      return res.status(200).json({ data: [], meta: response.meta });
    }

    // Fetch advanced stats for NET rating
    const ids = players.map(p => p.id);
    const advancedStatsRes = await fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${ids.join(',')}`, {
      headers: {
        Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
      },
    });

    if (!advancedStatsRes.ok) {
      console.error('Advanced stats fetch failed:', advancedStatsRes.status);
      // Return players without advanced stats rather than failing completely
      return res.status(200).json({
        data: players.map(player => ({ ...player, net_rating: 'N/A' })),
        meta: response.meta
      });
    }

    const advancedStats = await advancedStatsRes.json();

    const playersWithNetRating = players.map(player => {
      const stats = advancedStats.data.find(stat => stat.player.id === player.id);
      return {
        ...player,
        net_rating: stats?.net_rating ?? 'N/A',
      };
    });

    res.status(200).json({
      data: playersWithNetRating,
      meta: response.meta
    });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
} 