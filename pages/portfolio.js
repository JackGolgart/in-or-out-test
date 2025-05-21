import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

export default function Portfolio() {
  const { user, session } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'chart'

  useEffect(() => {
    if (user && session) {
      fetchPredictions();
    }
  }, [user, session]);

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/predictions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
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

  const prepareChartData = () => {
    const sortedPredictions = [...predictions].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    // Calculate cumulative performance over time
    const cumulativePerformance = sortedPredictions.reduce((acc, prediction, index) => {
      const performance = calculatePerformance(prediction);
      acc.push((acc[index - 1] || 0) + performance);
      return acc;
    }, []);

    // Find all-time high points
    let max = Number.NEGATIVE_INFINITY;
    const highPoints = cumulativePerformance.map((val, idx) => {
      if (val >= max) {
        max = val;
        return idx;
      }
      return null;
    }).filter(idx => idx !== null);

    return {
      labels: sortedPredictions.map(p => new Date(p.created_at).toLocaleDateString()),
      datasets: [
        {
          label: 'Portfolio Value',
          data: cumulativePerformance,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          borderWidth: 3,
          pointRadius: cumulativePerformance.map((_, idx) => highPoints.includes(idx) ? 7 : 4),
          pointBackgroundColor: cumulativePerformance.map((_, idx) => highPoints.includes(idx) ? '#facc15' : '#2563eb'),
          pointBorderColor: cumulativePerformance.map((_, idx) => highPoints.includes(idx) ? '#facc15' : '#fff'),
          pointHoverRadius: 9,
          fill: true,
          tension: 0.4,
          type: 'line'
        }
      ],
      highPoints,
      cumulativePerformance,
      labelsRaw: sortedPredictions.map(p => p.created_at),
    };
  };

  const chartOptions = (chartData) => ({
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            return `Portfolio Value: ${value > 0 ? '+' : ''}${value.toFixed(1)}`;
          }
        }
      },
      annotation: {
        annotations: chartData.highPoints.map(idx => ({
          type: 'point',
          xValue: chartData.labels[idx],
          yValue: chartData.cumulativePerformance[idx],
          backgroundColor: '#facc15',
          radius: 8,
          borderColor: '#facc15',
          borderWidth: 2,
          label: {
            display: true,
            content: 'ATH',
            color: '#facc15',
            font: { weight: 'bold' },
            position: 'top'
          }
        }))
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white',
          callback: function(value) {
            return value > 0 ? '+' + value.toFixed(1) : value.toFixed(1);
          }
        },
        title: {
          display: true,
          text: 'Performance',
          color: 'white'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white',
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  });

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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Your Portfolio</h1>
            <div className="flex items-center space-x-2">
              <span className="text-white">Cards</span>
              <button
                onClick={() => setViewMode(viewMode === 'cards' ? 'chart' : 'cards')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  viewMode === 'chart' ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    viewMode === 'chart' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-white">Chart</span>
            </div>
          </div>
          
          {predictions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">You haven't made any predictions yet.</p>
            </div>
          ) : viewMode === 'cards' ? (
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
          ) : (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Total Portfolio Performance: {predictions.reduce((sum, p) => sum + calculatePerformance(p), 0).toFixed(1)}
                </h2>
              </div>
              {(() => {
                const chartData = prepareChartData();
                return (
                  <Line data={chartData} options={chartOptions(chartData)} />
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
