const { initializeApi } = require('../../../lib/bdlClient');

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
    return errorHandler(res, 405, 'Method not allowed');
  }

  try {
    const { page = 1, per_page = 25, search = '' } = req.query;

    // Validate API key
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      console.error('API key missing in environment:', {
        env: process.env.NODE_ENV,
        hasKey: !!apiKey,
        envVars: Object.keys(process.env).filter(key => key.includes('BALL')),
      });
      return errorHandler(res, 401, 'API key not configured');
    }

    // Initialize API client
    let apiInstance;
    try {
      console.log('Initializing API client...');
      apiInstance = initializeApi();
      if (!apiInstance) {
        throw new Error('Failed to initialize API client');
      }
    } catch (initError) {
      console.error('API initialization error:', {
        error: initError,
        hasKey: !!apiKey,
        keyLength: apiKey?.length,
      });
      return errorHandler(res, 500, 'Failed to initialize API client');
    }

    // Fetch players with direct API call for better error handling
    const playersResponse = await fetch(
      `https://api.balldontlie.io/v2/players?page=${Math.max(1, parseInt(page))}&per_page=${Math.min(100, Math.max(1, parseInt(per_page)))}&search=${search}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!playersResponse.ok) {
      const errorText = await playersResponse.text();
      console.error('Ball Don\'t Lie API error:', {
        status: playersResponse.status,
        statusText: playersResponse.statusText,
        error: errorText,
      });
      return errorHandler(res, playersResponse.status, `API Error: ${errorText}`);
    }

    const response = await playersResponse.json();

    if (!response || !response.data) {
      return errorHandler(res, 500, 'Invalid API response format');
    }

    const players = response.data;

    // Send final response
    return res.status(200).json({
      data: players.map(player => ({
        ...player,
        net_rating: null, // We'll fetch this separately if needed
      })),
      meta: response.meta
    });

  } catch (error) {
    console.error('Unhandled API error:', error);
    return errorHandler(res, 500, error);
  }
};

export default handler; 