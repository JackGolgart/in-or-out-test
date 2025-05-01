export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.balldontlie.io/api/v1/players?per_page=100");
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Failed to fetch from BallDon'tLie" });
  }
}