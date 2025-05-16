import { createClient } from '@supabase/supabase-js';

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

    // Create a new Supabase client with the auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Log auth context for debugging
    console.log('Auth context:', {
      user_id: user.id,
      email: user.email,
      role: user.role,
      aud: user.aud
    });

    // Handle GET request
    if (req.method === 'GET') {
      const { data: predictions, error: fetchError } = await supabase
        .from('predictions')
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
      console.log('Raw request body:', req.body);
      console.log('Request headers:', {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'present' : 'missing'
      });

      const { player_id, prediction_type, net_rating, player_name } = req.body;

      // Log parsed data
      console.log('Parsed request data:', {
        player_id,
        prediction_type,
        net_rating,
        player_name,
        player_id_type: typeof player_id,
        net_rating_type: typeof net_rating
      });

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

      // Ensure player_id is an integer
      const formattedPlayerId = typeof player_id === 'number' 
        ? Math.floor(player_id)  // Ensure it's an integer
        : parseInt(player_id, 10);

      if (isNaN(formattedPlayerId)) {
        console.error('Invalid player_id:', player_id);
        return res.status(400).json({ 
          error: 'Invalid player_id',
          details: {
            received: player_id,
            expected: 'integer'
          }
        });
      }

      console.log('Formatted player ID:', {
        original: player_id,
        formatted: formattedPlayerId,
        original_type: typeof player_id,
        formatted_type: typeof formattedPlayerId
      });

      // Check if prediction already exists
      console.log('Checking for existing prediction:', {
        user_id: user.id,
        player_id: formattedPlayerId,
        player_id_type: typeof formattedPlayerId
      });
      
      const { data: existingPrediction, error: fetchError } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('player_id', formattedPlayerId)
        .single();

      if (fetchError) {
        console.error('Error checking existing prediction:', {
          error: fetchError,
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          player_id: formattedPlayerId
        });
        
        if (fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          return res.status(500).json({ 
            error: 'Failed to check existing prediction',
            details: {
              code: fetchError.code,
              message: fetchError.message
            }
          });
        }
      }

      let result;
      if (existingPrediction) {
        // Update existing prediction
        console.log('Updating existing prediction:', existingPrediction.id);
        const { data, error: updateError } = await supabase
          .from('predictions')
          .update({
            prediction_type: prediction_type.toLowerCase(),
            net_rating_at_prediction: netRatingNum,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPrediction.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating prediction:', {
            error: updateError,
            code: updateError.code,
            message: updateError.message,
            details: updateError.details
          });
          return res.status(500).json({ 
            error: 'Failed to update prediction',
            details: {
              code: updateError.code,
              message: updateError.message
            }
          });
        }
        result = data;
      } else {
        // Create new prediction
        const predictionData = {
          user_id: user.id,
          player_id: formattedPlayerId,
          prediction_type: prediction_type.toLowerCase(),
          net_rating_at_prediction: netRatingNum,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Validate data types before insert
        console.log('Validating prediction data types:', {
          user_id: {
            value: predictionData.user_id,
            type: typeof predictionData.user_id,
            expected: 'string (UUID)'
          },
          player_id: {
            value: predictionData.player_id,
            type: typeof predictionData.player_id,
            expected: 'number (integer)'
          },
          prediction_type: {
            value: predictionData.prediction_type,
            type: typeof predictionData.prediction_type,
            expected: 'string'
          },
          net_rating_at_prediction: {
            value: predictionData.net_rating_at_prediction,
            type: typeof predictionData.net_rating_at_prediction,
            expected: 'number'
          }
        });

        // First, check if the table exists and get its structure
        const { data: tableInfo, error: tableError } = await supabase
          .from('predictions')
          .select('*')
          .limit(0);

        if (tableError) {
          console.error('Error accessing predictions table:', {
            error: tableError,
            code: tableError.code,
            message: tableError.message
          });
          return res.status(500).json({ 
            error: 'Database table error',
            details: {
              code: tableError.code,
              message: tableError.message
            }
          });
        }

        console.log('Table structure:', tableInfo);

        // Try to insert the prediction
        try {
          console.log('Attempting to insert prediction with data:', JSON.stringify(predictionData, null, 2));
          
          const { data, error: insertError } = await supabase
            .from('predictions')
            .insert([predictionData])
            .select()
            .single();

          if (insertError) {
            console.error('Detailed error creating prediction:', {
              error: insertError,
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              data: predictionData,
              tableInfo: tableInfo,
              stack: insertError.stack,
              query: insertError.query,
              schema: insertError.schema,
              table: insertError.table,
              column: insertError.column,
              dataType: insertError.dataType,
              constraint: insertError.constraint
            });

            // Handle specific error cases
            if (insertError.code === '23505') { // Unique violation
              return res.status(400).json({ 
                error: 'Prediction already exists for this player',
                details: {
                  code: insertError.code,
                  message: insertError.message,
                  constraint: insertError.constraint
                }
              });
            }

            if (insertError.code === '23503') { // Foreign key violation
              return res.status(400).json({ 
                error: 'Invalid user or player reference',
                details: {
                  code: insertError.code,
                  message: insertError.message,
                  constraint: insertError.constraint,
                  column: insertError.column
                }
              });
            }

            if (insertError.code === '22P02') { // Invalid text representation
              return res.status(400).json({ 
                error: 'Invalid data format',
                details: {
                  code: insertError.code,
                  message: insertError.message,
                  hint: insertError.hint,
                  column: insertError.column,
                  dataType: insertError.dataType
                }
              });
            }

            return res.status(500).json({ 
              error: 'Failed to create prediction',
              details: {
                code: insertError.code,
                message: insertError.message,
                hint: insertError.hint,
                constraint: insertError.constraint,
                column: insertError.column,
                dataType: insertError.dataType
              }
            });
          }

          console.log('Prediction created successfully:', data);
          result = data;
        } catch (error) {
          console.error('Unexpected error during insert:', {
            error: error.message,
            stack: error.stack,
            data: predictionData,
            type: error.constructor.name
          });
          return res.status(500).json({ 
            error: 'Unexpected error during insert',
            details: {
              message: error.message,
              type: error.constructor.name
            }
          });
        }
      }

      // Award badges
      try {
        const badgeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/badges/award`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            prediction_id: result.id,
            prediction_type,
            net_rating,
            current_net_rating: net_rating // This will be updated when we implement net rating updates
          })
        });

        if (badgeResponse.ok) {
          const { awardedBadges } = await badgeResponse.json();
          if (awardedBadges?.length > 0) {
            console.log('Awarded badges:', awardedBadges);
          }
        }
      } catch (badgeError) {
        console.error('Error awarding badges:', badgeError);
        // Don't fail the prediction if badge awarding fails
      }

      return res.status(200).json(result);
    }
  } catch (error) {
    console.error('Unexpected error in predictions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 