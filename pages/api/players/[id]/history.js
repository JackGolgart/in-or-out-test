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
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Calculate seasons dynamically (last 6 seasons)
  const currentSeason = getCurrentNBASeason();
  const seasons = Array.from({ length: 6 }, (_, i) => currentSeason - i).sort();
  const history = [];

  for (let season of seasons) {
    try {
      const response = await fetch(
        `https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${id}&seasons[]=${season}&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      
      if (!response.ok) {
        // If we get a 404, it means no data for this season, which is normal
        if (response.status === 404) {
          history.push({ 
            season, 
            net_rating: null 
          });
          continue;
        }
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const seasonStats = data.data[0];
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
      // Don't throw error, just add null for this season
      history.push({ 
        season, 
        net_rating: null 
      });
    }
  }

  // Sort history by season in descending order
  history.sort((a, b) => b.season - a.season);

  res.status(200).json(history);
} 