// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  
  // NBA season starts in October (month 10)
  // If we're before October, use previous year as the season start
  return month < 10 ? year - 1 : year;
}

export default async function handler(req, res) {
  const { id } = req.query;
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  
  // Calculate seasons dynamically (last 6 seasons)
  const currentSeason = getCurrentNBASeason();
  const seasons = Array.from({ length: 6 }, (_, i) => currentSeason - i).sort();
  const history = [];

  for (let season of seasons) {
    try {
      const advancedStatsRes = await fetch(
        `https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${id}&seasons[]=${season}&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      
      if (!advancedStatsRes.ok) {
        throw new Error(`API returned ${advancedStatsRes.status}`);
      }

      const advancedStats = await advancedStatsRes.json();
      
      if (advancedStats.data && advancedStats.data.length > 0) {
        const seasonStats = advancedStats.data[0];
        history.push({ 
          season, 
          net_rating: seasonStats.net_rating 
        });
      } else {
        history.push({ 
          season, 
          net_rating: null 
        });
      }
    } catch (err) {
      console.error(`Failed for season ${season}:`, err);
      history.push({ 
        season, 
        net_rating: null 
      });
    }
  }

  res.status(200).json(history);
} 