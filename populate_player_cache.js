import { supabase } from "./lib/supabase.js";
import fetch from "node-fetch"; // Ensure node-fetch is installed

const BASE_URL = "https://api.balldontlie.io/v1";
const API_KEY = "c81d57c3-85f8-40f2-ad5b-0c268c0220a0"; // Your API key here
const MAX_PAGES = 6; // Limit the number of pages to fetch
const BATCH_SIZE = 5; // Number of rows to insert per batch

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithApiKey(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

async function fetchAllPlayers() {
  let page = 1; // Start with the first page
  const allPlayers = []; // Array to store all players

  while (page <= MAX_PAGES) { // Limit the number of pages to fetch
    try {
      console.log(`Fetching players from page: ${page}`);
      const response = await fetchWithApiKey(`${BASE_URL}/players?page=${page}&per_page=100`);

      if (!response.data || response.data.length === 0) {
        break; // No more players to fetch
      }

      // Add the players from the current page to the result
      allPlayers.push(...response.data);

      page++; // Increment the page number
      await delay(200); // Add delay to avoid hitting rate limits
    } catch (error) {
      console.error(`Error fetching players from page ${page}:`, error);
      break;
    }
  }

  console.log(`Fetched a total of ${allPlayers.length} players.`);
  return allPlayers;
}

async function populatePlayerCache() {
  const players = await fetchAllPlayers();

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE).map((player) => ({
      player_id: player.id,
      player: {
        first_name: player.first_name,
        last_name: player.last_name,
        team: player.team,
        position: player.position,
      },
      updated_at: new Date().toISOString(),
    }));

    try {
      console.log(`Inserting batch of ${batch.length} players...`);

      const { data, error } = await supabase.from("player_cache").upsert(batch).select();

      if (error) {
        console.error("Error upserting batch:", error);
      } else {
        console.log(`Successfully upserted ${data.length || batch.length} rows in batch.`);
      }

      await delay(200); // Add delay to avoid hitting rate limits
    } catch (error) {
      console.error("Failed to process batch:", error);
    }
  }

  console.log("All players have been processed.");
}

populatePlayerCache();