import { getPlayers } from '../../../lib/bdlClient';

export default async function handler(req, res) {
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

  const { query: search, page = '1', per_page = '25' } = req.query;

  try {
    // Validate input parameters
    const parsedPage = parseInt(page);
    const parsedPerPage = parseInt(per_page);

    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({ 
        error: 'Invalid page parameter',
        message: 'Page must be a positive number'
      });
    }

    if (isNaN(parsedPerPage) || parsedPerPage < 1 || parsedPerPage > 100) {
      return res.status(400).json({ 
        error: 'Invalid per_page parameter',
        message: 'per_page must be a number between 1 and 100'
      });
    }

    const response = await getPlayers({ 
      page: parsedPage,
      per_page: parsedPerPage,
      search: search || ''
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching players:', error);
    
    // Handle specific error types
    if (error.message.includes('API key')) {
      return res.status(401).json({ 
        error: 'Authentication error',
        message: 'API key is missing or invalid'
      });
    }
    
    if (error.message.includes('not initialized')) {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'API service is not initialized'
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch players. Please try again later.'
    });
  }
} 