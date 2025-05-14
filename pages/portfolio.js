import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { getSupabaseClient } from '../lib/supabaseClient';

const supabase = getSupabaseClient();

export default function Portfolio() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchPredictions();
    }
  }, [user]);

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/predictions', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch predictions');
      
      const data = await response.json();
      
      // Fetch current player stats for each prediction
      const predictionsWithCurrentStats = await Promise.all(
        data.map(async (prediction) => {
          const playerResponse = await fetch(`/api/players/${prediction.player_id}`);
          if (!playerResponse.ok) return prediction;
          
          const playerData = await playerResponse.json();
          return {
            ...prediction,
            current_net_rating: playerData.player.net_rating,
            player_name: `${playerData.player.first_name} ${playerData.player.last_name}`,
            team_name: playerData.player.team?.full_name
          };
        })
      );
      
      setPredictions(predictionsWithCurrentStats);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setError('Failed to load predictions');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePerformance = (prediction) => {
    if (!prediction.current_net_rating || !prediction.net_rating_at_prediction) return 0;
    
    const netRatingChange = prediction.current_net_rating - prediction.net_rating_at_prediction;
    return prediction.prediction_type === 'in' ? netRatingChange : -netRatingChange;
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">Please Log In</h1>
              <p className="text-gray-400">You need to be logged in to view your portfolio.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
              <p className="ml-4 text-gray-300">Loading your portfolio...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-red-400 mb-4">Error</h1>
              <p className="text-gray-400">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-white mb-8">Your Portfolio</h1>
          
          {predictions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">You haven't made any predictions yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {predictions.map((prediction) => {
                const performance = calculatePerformance(prediction);
                const performanceColor = performance > 0 ? 'text-green-400' : 'text-red-400';
                
                return (
                  <div key={prediction.id} className="card-base p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {prediction.player_name}
                        </h3>
                        <p className="text-gray-400">{prediction.team_name}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            prediction.prediction_type === 'in' 
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {prediction.prediction_type.toUpperCase()}
                          </span>
                          <span className={performanceColor}>
                            {performance > 0 ? '+' : ''}{performance.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Net Rating: {prediction.current_net_rating?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Prediction Date</p>
                          <p className="text-white">
                            {new Date(prediction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Net Rating at Prediction</p>
                          <p className="text-white">
                            {prediction.net_rating_at_prediction?.toFixed(1) || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
