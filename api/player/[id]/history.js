export default async function handler(req, res) {
  const { id } = req.query;
  const apiKey = 'c81d57c3-85f8-40f2-ad5b-0c268c0220a0';
  const seasons = [2018, 2019, 2020, 2021, 2022, 2023];
  const history = [];

  for (let season of seasons) {
    try {
      const statRes = await fetch(
        `https://api.balldontlie.io/v1/stats?player_ids[]=${id}&seasons[]=${season}&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const statJson = await statRes.json();
      const games = statJson.data;

      const totals = {
        pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
        fgm: 0, fga: 0, ftm: 0, fta: 0, tov: 0, min: 0,
      };

      games.forEach(g => {
        totals.pts += g.pts;
        totals.reb += g.reb;
        totals.ast += g.ast;
        totals.stl += g.stl;
        totals.blk += g.blk;
        totals.fgm += g.fgm;
        totals.fga += g.fga;
        totals.ftm += g.ftm;
        totals.fta += g.fta;
        totals.tov += g.turnover;
        if (typeof g.min === 'string') {
          const minPart = parseInt(g.min.split(':')[0], 10);
          totals.min += isNaN(minPart) ? 0 : minPart;
        }
      });

      let per = null;
      if (totals.min > 0) {
        per = (
          (totals.pts + totals.reb + totals.ast + totals.stl + totals.blk -
            (totals.fga - totals.fgm) -
            (totals.fta - totals.ftm) -
            totals.tov) /
          totals.min
        ).toFixed(2);
      }

      history.push({ season, per: per ? parseFloat(per) : null });
    } catch (err) {
      console.error(`Failed for season ${season}`, err);
    }
  }

  res.status(200).json(history);
}
