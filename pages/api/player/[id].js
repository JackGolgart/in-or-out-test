export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const response = await fetch(`https://www.balldontlie.io/api/v1/players/${id}`);
    const data = await response.json();

    if (!data || !data.id) {
      return res.status(404).json({ error: "Player not found" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Detail API error:", error);
    res.status(500).json({ error: "Failed to fetch player detail" });
  }
}