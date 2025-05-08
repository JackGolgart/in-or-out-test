import { BalldontlieAPI } from "@balldontlie/sdk";

// Initialize the API (no API key required)
const api = new BalldontlieAPI();

async function fetchPlayers() {
  try {
    // Fetch the first page of players
    const players = await api.nba.getPlayers();
    console.log(players.data);
  } catch (error) {
    console.error("Error fetching players:", error);
  }
}

fetchPlayers();