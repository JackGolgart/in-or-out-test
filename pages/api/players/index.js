import api, { initializeApi } from '../../../lib/bdlClient';

const handler = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page = 1, per_page = 25, search = '' } = req.query;

  console.log('Calling getPlayers with params:', { page, per_page, search });

  try {
    const apiInstance = initializeApi();
    console.log('API initialized successfully');

    console.log('Fetching players with params:', { page, per_page, search: search || undefined });

    const response = await apiInstance.nba.getPlayers({
      page: parseInt(page),
      per_page: parseInt(per_page),
      ...(search ? { search } : {})
    });

    if (!response || !response.data) {
      throw new Error('Invalid API response format');
    }

    console.log('Players API response:', {
      status: 'success',
      totalPlayers: response.meta?.total_count,
      currentPage: response.meta?.current_page,
      playersReturned: response.data.length
    });

    const players = Array.isArray(response.data) ? response.data : [];

    if (players.length === 0) {
      return res.status(200).json({ 
        data: [], 
        meta: {
          total_pages: response.meta?.total_pages || 0,
          current_page: parseInt(page),
          next_page: null
        }
      });
    }

    // Fetch advanced stats for NET rating
    const ids = players.map(p => p.id);
    const advancedStatsRes = await fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${ids.join(',')}&per_page=100`, {
      headers: {
        Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
      },
    });

    if (!advancedStatsRes.ok) {
      console.error('Advanced stats fetch failed:', advancedStatsRes.status);
      // Return players without advanced stats rather than failing completely
      return res.status(200).json({
        data: players.map(player => ({ ...player, net_rating: null })),
        meta: {
          total_pages: response.meta?.total_pages || 1,
          current_page: parseInt(page),
          next_page: parseInt(page) < (response.meta?.total_pages || 1) ? parseInt(page) + 1 : null
        }
      });
    }

    const advancedStats = await advancedStatsRes.json();

    const playersWithNetRating = players.map(player => {
      const stats = advancedStats.data.find(stat => stat.player_id === player.id);
      return {
        ...player,
        net_rating: stats?.net_rating ?? null,
      };
    });

    // Log successful response
    console.log('API Response success:', {
      total: response.meta?.total_count,
      current_page: response.meta?.current_page,
      per_page: response.meta?.per_page,
      players_with_ratings: playersWithNetRating.length
    });

    return res.status(200).json({
      data: playersWithNetRating,
      meta: {
        total_pages: response.meta?.total_pages || 1,
        current_page: parseInt(page),
        next_page: parseInt(page) < (response.meta?.total_pages || 1) ? parseInt(page) + 1 : null
      }
    });
  } catch (error) {
    console.error('Error in players API:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch players',
      details: error.message 
    });
  }
};

export default handler; 