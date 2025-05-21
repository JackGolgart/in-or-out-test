const { getApiClient } = require('../../../lib/bdlClient');

// Error handler wrapper to ensure we never send HTML responses
const errorHandler = (res, status, error) => {
  // Ensure we're sending JSON
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
  }
  
  // Format the error message
  let errorMessage;
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object') {
    try {
      errorMessage = JSON.stringify(error);
    } catch {
      errorMessage = 'Internal server error';
    }
  } else {
    errorMessage = 'Internal server error';
  }

  // Log the error for debugging
  console.error('API Error:', {
    status,
    error: errorMessage,
    originalError: error,
    stack: error instanceof Error ? error.stack : undefined
  });

  // Send a JSON response with a string error message
  return res.status(status).json({
    error: errorMessage,
    timestamp: new Date().toISOString()
  });
};

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  const year = today.getFullYear();
  
  // If we're in October or later, it's the season starting in that year
  // If we're in January through September, it's the season that started the previous year
  return month >= 10 ? year : year - 1;
}

async function fetchPlayerStats(api, playerId) {
  try {
    const currentSeason = getCurrentNBASeason();
    console.log(`Fetching stats for player ${playerId} for season ${currentSeason}`);
    
    // Fetch regular stats using v1 API
    const regularStats = await api.nba.getStats({
      player_ids: [playerId],
      seasons: [currentSeason]
    });

    // Log the responses for debugging
    console.log('Regular stats response:', {
      hasData: !!regularStats?.data,
      dataLength: regularStats?.data?.length,
      firstPlayer: regularStats?.data?.[0]?.id,
      stats: regularStats?.data?.[0]
    });

    if (!regularStats?.data?.[0]) {
      console.log('No regular stats found for player:', playerId);
      return null;
    }

    const playerStats = regularStats.data[0];
    
    // Try to fetch advanced stats using v2 API
    let advancedStatsData = null;
    try {
      const advancedStatsRes = await fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${playerId}&seasons[]=${currentSeason}&per_page=100`, {
        headers: {
          Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
        },
      });

      if (advancedStatsRes.ok) {
        const advancedStats = await advancedStatsRes.json();
        advancedStatsData = advancedStats.data?.[0] || null;
        
        console.log('Advanced stats response:', {
          hasData: !!advancedStats?.data,
          dataLength: advancedStats?.data?.length,
          firstPlayer: advancedStats?.data?.[0]?.player_id,
          netRating: advancedStats?.data?.[0]?.net_rating
        });
      }
    } catch (error) {
      console.error('Error fetching advanced stats:', error);
      // Continue without advanced stats
    }
    
    // Log the final stats object
    const stats = {
      net_rating: advancedStatsData?.net_rating ?? null,
      pts: playerStats.pts ?? 0,
      reb: playerStats.reb ?? 0,
      ast: playerStats.ast ?? 0,
      games_played: playerStats.games_played ?? 0,
      season: currentSeason
    };
    
    console.log('Final stats object:', {
      playerId,
      netRating: stats.net_rating,
      hasAdvancedStats: !!advancedStatsData,
      advancedStatsData,
      stats
    });

    return stats;
  } catch (error) {
    console.error(`Error fetching stats for player ${playerId}:`, error);
    return null;
  }
}

const handler = async (req, res) => {
  // Force JSON content type
  res.setHeader('Content-Type', 'application/json');

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ status: 'ok' });
  }

  // Validate method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page = 1, per_page = 25, search = '' } = req.query;
    const currentSeason = getCurrentNBASeason();

    // Debug: Log environment variables
    console.log('Environment check:', {
      hasApiKey: !!process.env.BALLDONTLIE_API_KEY,
      apiKeyLength: process.env.BALLDONTLIE_API_KEY?.length,
      env: process.env.NODE_ENV,
      envVars: Object.keys(process.env).filter(key => key.includes('BALL')),
      currentSeason,
      searchQuery: search
    });

    // Initialize API client
    let apiInstance;
    try {
      console.log('Initializing API client...');
      apiInstance = getApiClient('v1'); // Use v1 for basic player data
      if (!apiInstance) {
        throw new Error('Failed to initialize API client');
      }
    } catch (initError) {
      console.error('API initialization error:', {
        error: initError,
        stack: initError.stack,
      });
      return res.status(500).json({ error: `Client initialization failed: ${initError.message}` });
    }

    // Clean and validate search query
    const cleanSearch = search.trim();
    const hasSearch = cleanSearch.length > 0;

    // Use the SDK to fetch players with search
    let response;
    try {
      // Simplified search parameters with more flexible search
      const searchParams = {
        page: Math.max(1, parseInt(page)),
        per_page: Math.min(100, Math.max(1, parseInt(per_page)))
      };

      // Clean and format the search query
      if (cleanSearch.includes(' ')) {
        const [firstName, lastName] = cleanSearch.split(' ');
        // Try searching with just the last name first, as it's more unique
        searchParams.search = lastName;
      } else {
        searchParams.search = cleanSearch;
      }

      console.log('Searching with params:', searchParams);
      response = await apiInstance.nba.getPlayers(searchParams);

      // If we have results, filter them client-side for the full name match
      if (response?.data?.length > 0 && cleanSearch.includes(' ')) {
        const [firstName, lastName] = cleanSearch.split(' ');
        response.data = response.data.filter(player => {
          // For short first names (2-3 characters), use startsWith instead of exact match
          const isShortFirstName = firstName.length <= 3;
          const firstNameMatch = isShortFirstName 
            ? player.first_name.toLowerCase().startsWith(firstName.toLowerCase())
            : player.first_name.toLowerCase() === firstName.toLowerCase();
          
          return firstNameMatch && 
                 player.last_name.toLowerCase() === lastName.toLowerCase();
        });
      }
    } catch (error) {
      console.error('SDK Error:', {
        error,
        stack: error.stack,
        searchQuery: cleanSearch
      });
      return res.status(500).json({ error: 'Failed to fetch players from API' });
    }

    if (!response || !response.data) {
      console.log('No response data from API:', {
        searchQuery: cleanSearch,
        response: response
      });
      return res.status(200).json({
        data: [],
        meta: {
          total_count: 0,
          total_pages: 0,
          current_page: parseInt(page),
          per_page: parseInt(per_page)
        },
        message: hasSearch ? 'No players found matching your search' : 'No players found'
      });
    }

    const players = response.data;
    console.log('Initial API response:', {
      totalPlayers: players.length,
      firstPlayer: players[0] ? {
        id: players[0].id,
        name: `${players[0].first_name} ${players[0].last_name}`,
        team: players[0].team?.full_name
      } : null,
      searchQuery: cleanSearch
    });

    // Initialize v2 API for advanced stats
    let apiV2;
    try {
      apiV2 = getApiClient('v2');
    } catch (error) {
      console.error('Failed to initialize v2 API for advanced stats:', error);
      // Continue without advanced stats
    }

    // Fetch stats for each player in parallel
    const playersWithStats = await Promise.all(
      players.map(async (player) => {
        try {
          console.log(`Fetching stats for player ${player.id} for season ${currentSeason}`);
          
          // Get the player's most recent game to determine current team
          console.log('Fetching most recent game for team info');
          const recentStatsResponse = await apiInstance.nba.getStats({
            player_ids: [player.id],
            seasons: [currentSeason],
            per_page: 100, // Increased to ensure we get enough games
            sort: ['-game.date'] // Sort by most recent first
          });

          // Get today's date for filtering
          const today = new Date();
          today.setHours(23, 59, 59, 999); // Set to end of day to include today's games

          // Filter games up to today's date and sort by most recent
          const recentGames = (recentStatsResponse?.data || [])
            .filter(g => {
              const gameDate = new Date(g.game.date);
              return gameDate <= today;
            })
            .sort((a, b) => new Date(b.game.date) - new Date(a.game.date));

          // Update team information if we have recent game data
          if (recentGames.length > 0) {
            const mostRecent = recentGames[0];
            console.log('Recent game data:', {
              date: mostRecent.game.date,
              team: mostRecent.team?.full_name,
              opponent: mostRecent.game.home_team_id === mostRecent.team.id ? 
                'vs ' + mostRecent.game.visitor_team_id : 
                'at ' + mostRecent.game.home_team_id
            });

            if (mostRecent.team) {
              console.log('Updating team info from recent game:', {
                oldTeam: player.team?.full_name,
                newTeam: mostRecent.team.full_name
              });
              player.team = mostRecent.team;
            }
          } else {
            console.log('No recent games found for team update');
          }

          // Then get all stats for season averages
          const statsResponse = await apiInstance.nba.getStats({
            player_ids: [player.id],
            seasons: [currentSeason],
            per_page: 100 // Increased to ensure we get all games
          });

          console.log('Regular stats response:', {
            hasData: !!statsResponse?.data,
            dataLength: statsResponse?.data?.length,
            firstPlayer: statsResponse?.data?.[0]?.player?.id,
            stats: statsResponse?.data?.[0]
          });

          if (!statsResponse?.data?.length) {
            console.log(`No regular stats found for player: ${player.id}`);
            return {
              ...player,
              net_rating: null,
              pts: 0,
              reb: 0,
              ast: 0,
              games_played: 0,
              season: currentSeason
            };
          }

          // Calculate season averages
          const stats = statsResponse.data;
          
          // Filter out games where the player didn't play (minutes = 0 or '00')
          const playedGames = stats.filter(g => {
            const minutes = g.min;
            return minutes && minutes !== '00' && minutes !== '0';
          });

          const seasonAverages = {
            games_played: playedGames.length,
            pts: playedGames.length > 0 ? 
              (playedGames.reduce((sum, game) => sum + (game.pts || 0), 0) / playedGames.length).toFixed(1) : '0.0',
            reb: playedGames.length > 0 ? 
              (playedGames.reduce((sum, game) => sum + (game.reb || 0), 0) / playedGames.length).toFixed(1) : '0.0',
            ast: playedGames.length > 0 ? 
              (playedGames.reduce((sum, game) => sum + (game.ast || 0), 0) / playedGames.length).toFixed(1) : '0.0'
          };

          const finalStats = {
            playerId: player.id,
            netRating: null,
            hasAdvancedStats: false,
            advancedStatsData: null,
            stats: {
              net_rating: null,
              pts: parseFloat(seasonAverages.pts),
              reb: parseFloat(seasonAverages.reb),
              ast: parseFloat(seasonAverages.ast),
              games_played: seasonAverages.games_played,
              season: currentSeason
            }
          };

          console.log('Final stats object:', finalStats);
          return { ...player, ...finalStats.stats };
        } catch (error) {
          console.error(`Error fetching stats for player ${player.id}:`, error);
          return {
            ...player,
            net_rating: null,
            pts: 0,
            reb: 0,
            ast: 0,
            games_played: 0,
            season: currentSeason
          };
        }
      })
    );

    // Update the active players filter
    const activePlayers = playersWithStats.filter(player => 
      player && 
      (player.games_played > 0 || player.pts > 0 || player.reb > 0 || player.ast > 0) && 
      player.season === currentSeason
    );

    // If we have a search query, perform additional client-side filtering
    let filteredPlayers = activePlayers;
    if (hasSearch) {
      filteredPlayers = activePlayers.filter(player => {
        const fullName = `${player.first_name} ${player.last_name}`;
        const teamName = player.team?.full_name || '';
        const teamAbbr = player.team?.abbreviation || '';
        
        // If search contains a space, handle first/last name separately
        if (cleanSearch.includes(' ')) {
          const [searchFirstName, searchLastName] = cleanSearch.split(' ');
          const isShortFirstName = searchFirstName.length <= 3;
          const firstNameMatch = isShortFirstName
            ? player.first_name.toLowerCase().startsWith(searchFirstName.toLowerCase())
            : player.first_name.toLowerCase() === searchFirstName.toLowerCase();
          
          return firstNameMatch && 
                 player.last_name.toLowerCase() === searchLastName.toLowerCase();
        }
        
        // For single word searches, try exact match first
        if (fullName === cleanSearch) return true;
        
        // Then try partial matches (case-insensitive)
        return fullName.toLowerCase().includes(cleanSearch.toLowerCase()) || 
               teamName.toLowerCase().includes(cleanSearch.toLowerCase()) || 
               teamAbbr.toLowerCase().includes(cleanSearch.toLowerCase());
      });

      console.log('Filtered players:', {
        totalPlayers: players.length,
        activePlayers: activePlayers.length,
        filteredPlayers: filteredPlayers.length,
        searchQuery: cleanSearch,
        firstPlayer: filteredPlayers[0] ? {
          id: filteredPlayers[0].id,
          name: `${filteredPlayers[0].first_name} ${filteredPlayers[0].last_name}`,
          team: filteredPlayers[0].team?.full_name
        } : null
      });
    }

    // Ensure each player's team is a valid object
    const normalizedPlayers = filteredPlayers.map(player => {
      if (!player || typeof player !== 'object') return null;
      let team = player.team;
      if (!team || typeof team !== 'object') {
        team = { abbreviation: 'UNK', full_name: 'Unknown Team' };
      } else {
        if (!team.abbreviation) team.abbreviation = 'UNK';
        if (!team.full_name) team.full_name = 'Unknown Team';
      }
      return { ...player, team };
    }).filter(Boolean);

    // Validate the response data
    const validPlayers = normalizedPlayers.filter(player => 
      player && 
      typeof player === 'object' && 
      player.id && 
      player.first_name && 
      player.last_name && 
      player.team
    );

    if (validPlayers.length === 0) {
      console.log('No valid players found in response:', {
        searchQuery: cleanSearch,
        originalCount: players.length,
        activeCount: activePlayers.length,
        filteredCount: filteredPlayers.length,
        firstPlayer: players[0]
      });
      return res.status(200).json({
        data: [],
        meta: {
          total_count: 0,
          total_pages: 0,
          current_page: parseInt(page),
          per_page: parseInt(per_page)
        },
        message: hasSearch ? 'No active players found matching your search' : 'No active players found'
      });
    }

    // Debug: Log the first valid player before sending response
    console.log('First valid player to be sent:', validPlayers[0]);

    // Send final response
    return res.status(200).json({
      data: validPlayers,
      meta: {
        total_count: validPlayers.length,
        total_pages: Math.ceil(validPlayers.length / parseInt(per_page)),
        current_page: parseInt(page),
        per_page: parseInt(per_page)
      }
    });

  } catch (error) {
    console.error('Unhandled API error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to fetch players' });
  }
};

export default handler; 