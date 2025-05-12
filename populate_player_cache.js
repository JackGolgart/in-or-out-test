require('dotenv').config();

import { supabase } from "./lib/supabase.js";
import { batchUpdatePlayerCache, cleanupOldCache } from "./lib/playerCache.js";
import fetch from "node-fetch";

const BASE_URL = "https://api.balldontlie.io/v2";
const API_KEY = process.env.BALLDONTLIE_API_KEY;
const MAX_PAGES = 50;
const BATCH_SIZE = 5;
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests

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
  let page = 1;
  const allPlayers = [];

  while (page <= MAX_PAGES) {
    try {
      console.log(`Fetching players from page: ${page}`);
      const response = await fetchWithApiKey(`${BASE_URL}/players?page=${page}&per_page=100`);

      if (!response.data || response.data.length === 0) {
        break;
      }

      allPlayers.push(...response.data);
      page++;
      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Error fetching players from page ${page}:`, error);
      break;
    }
  }

  console.log(`Fetched a total of ${allPlayers.length} players.`);
  return allPlayers;
}

async function fetchPlayerData(player) {
  try {
    const [advancedStats, seasonAverages] = await Promise.all([
      fetchWithApiKey(`${BASE_URL}/stats/advanced?player_ids[]=${player.id}`),
      fetchWithApiKey(`${BASE_URL}/season_averages?player_ids[]=${player.id}&season=2023`)
    ]);

    return {
      id: player.id,
      playerData: player,
      advancedStats: advancedStats.data[0] || null,
      seasonAverages: seasonAverages.data[0] || null
    };
  } catch (error) {
    console.error(`Error fetching data for player ${player.id}:`, error);
    return null;
  }
}

async function populatePlayerCache() {
  console.log("Starting cache population...");
  
  // Clean up old cache entries first
  await cleanupOldCache();
  console.log("Old cache entries cleaned up.");

  const players = await fetchAllPlayers();
  console.log(`Starting to process ${players.length} players...`);

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(player => fetchPlayerData(player));
    
    try {
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(Boolean);
      
      if (validResults.length > 0) {
        await batchUpdatePlayerCache(validResults);
        console.log(`Successfully cached batch of ${validResults.length} players.`);
      }

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error("Failed to process batch:", error);
    }
  }

  console.log("Cache population completed.");
}

// Run the script
populatePlayerCache().catch(console.error);