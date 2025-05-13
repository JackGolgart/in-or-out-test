import { getPlayerStats, getAdvancedStats } from '../../../lib/bdlClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const [stats, advancedStats] = await Promise.all([
      getPlayerStats(parseInt(id)),
      getAdvancedStats(parseInt(id))
    ]);

    return res.status(200).json({
      stats: stats.data,
      advancedStats: advancedStats.data
    });
  } catch (error) {
    console.error('Error fetching player details:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch player details',
      details: error.message 
    });
  }
} 