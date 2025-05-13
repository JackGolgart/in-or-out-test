import { getPlayers } from '../../../lib/bdlClient';

const handler = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are allowed'
    });
  }

  try {
    console.log('API Request:', {
      method: req.method,
      query: req.query,
      headers: req.headers
    });

    const { query: search, page = '1', per_page = '25' } = req.query;

    // Validate input parameters
    const parsedPage = parseInt(page);
    const parsedPerPage = parseInt(per_page);

    if (isNaN(parsedPage) || parsedPage < 1) {
      console.error('Invalid page parameter:', page);
      return res.status(400).json({ 
        error: 'Invalid page parameter',
        message: 'Page must be a positive number'
      });
    }

    if (isNaN(parsedPerPage) || parsedPerPage < 1 || parsedPerPage > 100) {
      console.error('Invalid per_page parameter:', per_page);
      return res.status(400).json({ 
        error: 'Invalid per_page parameter',
        message: 'per_page must be a number between 1 and 100'
      });
    }

    // Log the parameters being passed to getPlayers
    console.log('Calling getPlayers with params:', {
      page: parsedPage,
      per_page: parsedPerPage,
      search: search || ''
    });

    const response = await getPlayers({ 
      page: parsedPage,
      per_page: parsedPerPage,
      search: search || ''
    });

    // Log successful response
    console.log('API Response success:', {
      total: response.meta?.total_count,
      current_page: response.meta?.current_page,
      per_page: response.meta?.per_page
    });

    return res.status(200).json(response);
  } catch (error) {
    // Log the full error details
    console.error('API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle specific error types
    if (error.message?.includes('API key')) {
      return res.status(401).json({ 
        error: 'Authentication error',
        message: 'API key is missing or invalid'
      });
    }
    
    if (error.message?.includes('not initialized')) {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'API service is not initialized'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later'
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch players. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default handler; 