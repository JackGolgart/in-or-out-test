export default async function handler(req, res) {
  const { search = "" } = req.query;
  const query = encodeURIComponent(search);
  const url = `https://api.balldontlie.io/v1/players?per_page=100&search=${query}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer c81d57c3-85f8-40f2-ad5b-0c268c0220a0',
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    if (!Array.isArray(data.data)) throw new Error("Invalid player data");
    res.status(200).json({ data: data.data });
  } catch (err) {
    console.error("Search fetch error:", err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
}