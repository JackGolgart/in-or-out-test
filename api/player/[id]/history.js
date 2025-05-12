export default async function handler(req, res) {
  const { id } = req.query;
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  const seasons = [2018, 2019, 2020, 2021, 2022, 2023];
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
      console.error(`Failed for season ${season}`, err);
      history.push({ 
        season, 
        net_rating: null 
      });
    }
  }

  res.status(200).json(history);
}
