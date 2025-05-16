import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Set content type for all responses
  res.setHeader('Content-Type', 'application/json');

  // Check request method
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('No authorization header provided');
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('No token provided in authorization header');
      return res.status(401).json({ error: 'No token provided in authorization header' });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Handle GET request
    if (req.method === 'GET') {
      const { data: predictions, error: fetchError } = await supabase
        .from('user_picks')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching predictions:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch predictions' });
      }

      return res.status(200).json(predictions || []);
    }

    // Handle POST request
    if (req.method === 'POST') {
      console.log('Received prediction request:', req.body);
      const { player_id, prediction_type, net_rating, player_name } = req.body;

      // Validate required fields
      const missingFields = [];
      if (!player_id) missingFields.push('player_id');
      if (!prediction_type) missingFields.push('prediction_type');
      if (!player_name) missingFields.push('player_name');
      if (net_rating === undefined || net_rating === null) missingFields.push('net_rating');

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        console.error('Received data:', req.body);
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: {
            missingFields,
            receivedData: req.body
          }
        });
      }

      // Validate prediction type
      if (!['in', 'out'].includes(prediction_type.toLowerCase())) {
        console.error('Invalid prediction type:', prediction_type);
        return res.status(400).json({ 
          error: 'Invalid prediction type',
          details: {
            received: prediction_type,
            allowed: ['in', 'out']
          }
        });
      }

      // Validate net_rating is a number
      const netRatingNum = Number(net_rating);
      if (isNaN(netRatingNum)) {
        console.error('Invalid net_rating:', net_rating);
        return res.status(400).json({ 
          error: 'Invalid net_rating',
          details: {
            received: net_rating,
            expected: 'number'
          }
        });
      }

      // Check if prediction already exists
      const { data: existingPrediction, error: fetchError } = await supabase
        .from('user_picks')
        .select('*')
        .eq('user_id', user.id)
        .eq('player_id', player_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing prediction:', fetchError);
        return res.status(500).json({ error: 'Failed to check existing prediction' });
      }

      let result;
      if (existingPrediction) {
        // Update existing prediction
        console.log('Updating existing prediction:', existingPrediction.id);
        const { data, error: updateError } = await supabase
          .from('user_picks')
          .update({
            selection: prediction_type.toLowerCase(),
            locked_in_per: net_rating,
            player_name: player_name
          })
          .eq('id', existingPrediction.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating prediction:', updateError);
          return res.status(500).json({ error: 'Failed to update prediction' });
        }
        result = data;
      } else {
        // Create new prediction
        console.log('Creating new prediction');
        const { data, error: insertError } = await supabase
          .from('user_picks')
          .insert({
            user_id: user.id,
            player_id,
            player_name,
            selection: prediction_type.toLowerCase(),
            locked_in_per: net_rating
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating prediction:', insertError);
          return res.status(500).json({ error: 'Failed to create prediction' });
        }
        result = data;
      }

      console.log('Prediction saved successfully:', result);
      return res.status(200).json(result);
    }
  } catch (error) {
    console.error('Unexpected error in predictions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 