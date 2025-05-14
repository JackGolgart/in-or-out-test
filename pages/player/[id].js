import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination, Autoplay } from 'swiper/modules';
import { getApiClient } from '../../lib/bdlClient';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import styles from '../../styles/Player.module.css';

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  
  // NBA season starts in October (month 10)
  // If we're before October, use previous year as the season start
  return month < 10 ? year - 1 : year;
}

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlayoff, setShowPlayoff] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/players/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch player data');
        }
        const data = await response.json();
        if (!data.player) {
          throw new Error('Player data not found');
        }
        setPlayer(data.player);
      } catch (err) {
        console.error('Error fetching player:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
              <p className="ml-4 text-gray-300">Loading player data...</p>
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
              <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
              <p className="text-gray-300 mb-8">{error}</p>
              <Link href="/search" className="btn-primary">
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!player) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-300 mb-4">Player Not Found</h2>
              <p className="text-gray-400 mb-8">The requested player could not be found.</p>
              <Link href="/search" className="btn-primary">
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Choose which averages to show
  const averages = showPlayoff ? player.playoff_averages : player.regular_averages;
  const toggleLabel = showPlayoff ? 'Playoff Averages' : 'Regular Season Averages';

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        {/* Player Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <Link href="/search" className="text-gray-400 hover:text-white transition-colors">
                ← Back to Search
              </Link>
            </div>
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                {player.first_name} {player.last_name}
              </h1>
              <div className="text-lg text-gray-300">
                <p className="mb-2">#{player.jersey_number} | {player.position}</p>
                <p>{player.team?.full_name || 'No Team'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Switch for regular/playoff averages */}
          <div className="flex items-center justify-center mb-8">
            <span className="text-gray-400 mr-4">Regular Season</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showPlayoff}
                onChange={() => setShowPlayoff((v) => !v)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
            <span className="text-gray-400 ml-4">Playoffs</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="card-base p-6 text-center">
              <span className="text-3xl font-bold text-white block mb-2">{averages.points.toFixed(1)}</span>
              <span className="text-gray-400">Points</span>
            </div>
            <div className="card-base p-6 text-center">
              <span className="text-3xl font-bold text-white block mb-2">{averages.rebounds.toFixed(1)}</span>
              <span className="text-gray-400">Rebounds</span>
            </div>
            <div className="card-base p-6 text-center">
              <span className="text-3xl font-bold text-white block mb-2">{averages.assists.toFixed(1)}</span>
              <span className="text-gray-400">Assists</span>
            </div>
            <div className="card-base p-6 text-center">
              <span className="text-3xl font-bold text-white block mb-2">{averages.games_played}</span>
              <span className="text-gray-400">Games</span>
            </div>
          </div>

          {/* Recent Games */}
          <div className="card-base p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Recent Games</h3>
            {player.recent_games.length > 0 ? (
              <div className="space-y-4">
                {player.recent_games.map((game, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-gray-400 text-sm">{formatDate(game.date)}</div>
                      <div className="text-white font-medium">{game.result}</div>
                      <div className="text-gray-400 text-sm">{game.score}</div>
                    </div>
                    <div className="flex space-x-6">
                      <div className="text-center">
                        <span className="text-white font-medium block">{game.points}</span>
                        <span className="text-gray-400 text-sm">PTS</span>
                      </div>
                      <div className="text-center">
                        <span className="text-white font-medium block">{game.rebounds}</span>
                        <span className="text-gray-400 text-sm">REB</span>
                      </div>
                      <div className="text-center">
                        <span className="text-white font-medium block">{game.assists}</span>
                        <span className="text-gray-400 text-sm">AST</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No recent games available</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const { id } = params;
    console.log('Fetching player data for ID:', id);
    
    // Fetch player data from our API endpoint
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const playerRes = await fetch(`${apiUrl}/api/players/${id}`);
    const playerData = await playerRes.json();
    
    if (!playerRes.ok) {
      console.error('Player API error:', playerData);
      return {
        props: {
          error: playerData.error || 'Failed to load player data',
          player: null,
          stats: null,
          gameStats: [],
          playerHistory: []
        }
      };
    }

    const { player, seasonAverages } = playerData;
    if (!player) {
      console.error('Player not found in response:', playerData);
      return {
        props: {
          error: 'Player not found',
          player: null,
          stats: null,
          gameStats: [],
          playerHistory: []
        }
      };
    }

    console.log('Successfully fetched player data:', {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      hasStats: !!seasonAverages
    });

    // Fetch player history
    const historyRes = await fetch(`${apiUrl}/api/players/${id}/history`);
    const history = await historyRes.json();

    // Fetch recent games
    const currentSeason = getCurrentNBASeason();
    const apiInstance = getApiClient();
    const statsRes = await apiInstance.nba.getStats({ 
      player_ids: [parseInt(id)],
      seasons: [currentSeason],
      per_page: 10,
      sort: ['-game.date']
    });

    const recentGames = statsRes.data || [];

    return {
      props: {
        player,
        stats: seasonAverages,
        gameStats: recentGames,
        playerHistory: history
      }
    };
  } catch (error) {
    console.error('Error fetching player data:', error);
    return {
      props: {
        error: 'Failed to load player data',
        player: null,
        stats: null,
        gameStats: [],
        playerHistory: []
      }
    };
  }
}
