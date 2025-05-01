export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.balldontlie.io/v1/players?per_page=100", {
      headers: {
        'Authorization': 'Bearer c81d57c3-85f8-40f2-ad5b-0c268c0220a0',
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    if (!Array.isArray(data.data)) throw new Error("Invalid data shape");

    res.status(200).json({ data: data.data });
  } catch (err) {
    console.error("BallDon'tLie fetch error:", err);
    res.status(500).json({ error: "Unable to fetch players" });
  }
}