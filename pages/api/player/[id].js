// pages/api/player/[id].js

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // 1. Get player basic info
    const playerResponse = await fetch(`https://www.balldontlie.io/api/v1/players/${id}`);
    const playerData = await playerResponse.json();

    if (!playerData || !playerData.id) {
      return res.status(404).json({ error: "Player not found" });
    }

    // 2. Get player's season average stats
    const season = 2023; // Update if needed
    const statsResponse = await fetch(`https://www.balldontlie.io/api/v1/season_averages?season=${season}&player_ids[]=${id}`);
    const statsData = await statsResponse.json();

    // Combine player info and PER data
    res.status(200).json({
      player: playerData,
      seasonAverages: statsData.data[0] || null,
    });
  } catch (error) {
    console.error("API error:", error.message);
    res.status(500).json({ error: "Failed to fetch player data" });
  }
}
