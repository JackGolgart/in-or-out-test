import { supabase } from "./lib/supabase.js";
import fetch from "node-fetch"; // Ensure node-fetch is installed

const BASE_URL = "https://api.balldontlie.io/v1";
const API_KEY = "c81d57c3-85f8-40f2-ad5b-0c268c0220a0"; // Your API key here

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
  const allPlayers = [];

  while (true) {
    try {
      console.log(`Fetching players from page: ${page}`);
      const response = await fetchWithApiKey(`${BASE_URL}/players?page=${page}&per_page=100`);

      if (!response.data || response.data.length === 0) {
        break; // No more players to fetch
      }

      // Add the players from the current page to the result
      allPlayers.push(...response.data);

      // Check if there are more pages to fetch
      if (!response.meta || !response.meta.next_page) {
        break; // Exit the loop if there are no more pages
      }

      page++; // Proceed to the next page
      await delay(200); // Add delay to avoid hitting rate limits
    } catch (error) {
      console.error(`Error fetching players from page ${page}:`, error);
      break;
    }
  }

  return allPlayers;
}

async function populatePlayerCache() {
  const players = await fetchAllPlayers();

  for (const player of players) {
    try {
      const { id, first_name, last_name, team, position } = player;

      console.log(`Inserting data for player ID: ${id}`);

      // Insert player details into Supabase
      const { data, error } = await supabase.from("player_cache").upsert({
        player_id: id,
        player: { first_name, last_name, team, position },
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`Error inserting player ID ${id}:`, error);
      } else {
        console.log(`Successfully inserted player ID ${id}`);
      }

      await delay(200); // Add delay to avoid rate limits
    } catch (error) {
      console.error(`Failed to process player ID ${player.id}:`, error);
    }
  }
}

populatePlayerCache();