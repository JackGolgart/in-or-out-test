import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination, Autoplay } from 'swiper/modules';
import { getApiClient } from '../../lib/bdlClient';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import styles from '../../styles/Player.module.css';
import getTeamLogo from '../../lib/teamLogos';
import { useAuth } from '../../contexts/AuthContext';

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  
  // NBA season starts in October (month 10)
  // If we're before October, use previous year as the season start
  return month < 10 ? year - 1 : year;
}

export default function PlayerPage({ player, stats, gameStats, playerHistory, error }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error);
  const [showPlayoffs, setShowPlayoffs] = useState(false);
  const [playerData, setPlayerData] = useState(player);
  const [seasonStats, setSeasonStats] = useState(stats);
  const [recentGames, setRecentGames] = useState(gameStats);
  const [history, setHistory] = useState(playerHistory);
  const [prediction, setPrediction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter recent games based on showPlayoffs state
  const filteredRecentGames = useMemo(() => {
    console.log('Filtering games:', {
      totalGames: playerData?.recent_games?.length || 0,
      showPlayoffs,
      firstGame: playerData?.recent_games?.[0]
    });

    if (!playerData?.recent_games) return [];

    return playerData.recent_games
      .filter(game => {
        const isPlayoff = game.isPlayoff === true;
        console.log('Filtering game:', {
          date: game.date,
          isPlayoff,
          showPlayoffs,
          matches: isPlayoff === showPlayoffs
        });
        return isPlayoff === showPlayoffs;
      });
  }, [playerData?.recent_games, showPlayoffs]);

  // Update averages based on showPlayoffs state
  const averages = useMemo(() => {
    if (!playerData) return null;
    return showPlayoffs ? playerData.playoff_averages : playerData.regular_averages;
  }, [playerData, showPlayoffs]);

  // Update state when props change
  useEffect(() => {
    if (playerData) {
      console.log('Updating player data:', {
        hasRegularGames: playerData.regular_averages?.games_played > 0,
        hasPlayoffGames: playerData.playoff_averages?.games_played > 0,
        regularGames: playerData.recent_games?.filter(g => !g.isPlayoff).length || 0,
        playoffGames: playerData.recent_games?.filter(g => g.isPlayoff).length || 0
      });
      setShowPlayoffs(false); // Default to regular season
    }
  }, [playerData]);

  // Fetch prediction only when user or player ID changes
  useEffect(() => {
    if (user && player?.id) {
      fetchPrediction();
    }
  }, [user, player?.id]);

  const fetchPrediction = async () => {
    try {
      const response = await fetch('/api/predictions');
      if (!response.ok) throw new Error('Failed to fetch prediction');
      const data = await response.json();
      const playerPrediction = data.find(p => p.player_id === player.id);
      setPrediction(playerPrediction);
    } catch (error) {
      console.error('Error fetching prediction:', error);
    }
  };

  const handlePrediction = async (type) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          player_id: player.id,
          prediction_type: type,
          net_rating: player.net_rating
        })
      });

      if (!response.ok) throw new Error('Failed to save prediction');

      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Error saving prediction:', error);
      setErrorMessage('Failed to save prediction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle change
  const handleToggleChange = () => {
    const newValue = !showPlayoffs;
    console.log('Toggling playoffs:', {
      from: showPlayoffs,
      to: newValue,
      availableGames: {
        regular: recentGames.filter(g => !g.isPlayoff).length,
        playoff: recentGames.filter(g => g.isPlayoff).length
      },
      allGames: recentGames.map(g => ({
        date: g.date,
        isPlayoff: g.isPlayoff,
        type: g.gameType
      }))
    });
    setShowPlayoffs(newValue);
  };

  // Debug log for recent games
  useEffect(() => {
    console.log('Recent games state:', {
      total: recentGames.length,
      regular: recentGames.filter(g => !g.isPlayoff).length,
      playoff: recentGames.filter(g => g.isPlayoff).length,
      games: recentGames.map(g => ({
        date: g.date,
        isPlayoff: g.isPlayoff,
        type: g.gameType
      }))
    });
  }, [recentGames]);

  if (isLoading) {
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

  if (errorMessage) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
              <p className="text-gray-300 mb-8">{errorMessage}</p>
              <Link href="/search" className="btn-primary">
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!playerData) {
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
              {playerData.team && (
                <div className="mb-6 flex justify-center">
                  <img 
                    src={getTeamLogo(playerData.team.abbreviation)} 
                    alt={`${playerData.team.full_name} logo`}
                    className="w-24 h-24 object-contain"
                  />
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                {playerData.first_name} {playerData.last_name}
              </h1>
              <div className="text-lg text-gray-300">
                <p className="mb-2">#{playerData.jersey_number} | {playerData.position}</p>
                <p>{playerData.team?.full_name || 'No Team'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Prediction Buttons */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Make Your Prediction</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => handlePrediction('in')}
                disabled={isSubmitting || prediction?.prediction_type === 'in'}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                  prediction?.prediction_type === 'in'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'IN'}
              </button>
              <button
                onClick={() => handlePrediction('out')}
                disabled={isSubmitting || prediction?.prediction_type === 'out'}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                  prediction?.prediction_type === 'out'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'OUT'}
              </button>
            </div>
            {prediction && (
              <p className="mt-2 text-gray-400">
                You predicted {prediction.prediction_type.toUpperCase()} at net rating {prediction.net_rating_at_prediction.toFixed(1)}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="card-base p-6 text-center">
              <span className="text-3xl font-bold text-white block mb-2">{averages?.points?.toFixed(1) || '0.0'}</span>
              <span className="text-gray-400">Points</span>
            </div>
            <div className="card-base p-6 text-center">
              <span className="text-3xl font-bold text-white block mb-2">{averages?.rebounds?.toFixed(1) || '0.0'}</span>
              <span className="text-gray-400">Rebounds</span>
            </div>
            <div className="card-base p-6 text-center">
              <span className="text-3xl font-bold text-white block mb-2">{averages?.assists?.toFixed(1) || '0.0'}</span>
              <span className="text-gray-400">Assists</span>
            </div>
            <div className="card-base p-6 text-center">
              <span className="text-3xl font-bold text-white block mb-2">{averages?.games_played || 0}</span>
              <span className="text-gray-400">Games</span>
            </div>
          </div>

          {/* Recent Games */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Recent Games</h3>
              <div className="flex items-center space-x-2">
                <span className="text-white">Regular Season</span>
                <button
                  onClick={handleToggleChange}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    showPlayoffs ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showPlayoffs ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-white">Playoffs</span>
              </div>
            </div>
            {filteredRecentGames.length > 0 ? (
              <div className="space-y-4">
                {filteredRecentGames.map((game, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="text-gray-400 text-sm">{formatDate(game.date)}</div>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          game.isPlayoff 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {game.gameType}
                        </span>
                      </div>
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
              <p className="text-gray-400 text-center py-8">
                No {showPlayoffs ? 'playoff' : 'regular season'} games available
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ params, req }) {
  try {
    const { id } = params;
    console.log('Fetching player data for ID:', id);
    
    // Get the base URL for API calls
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    
    // Fetch player data and history in parallel
    const [playerRes, historyRes] = await Promise.all([
      fetch(`${baseUrl}/api/players/${id}`),
      fetch(`${baseUrl}/api/players/${id}/history`)
    ]);

    if (!playerRes.ok) {
      const errorData = await playerRes.json();
      console.error('Player API error:', {
        status: playerRes.status,
        error: errorData,
        playerId: id,
        url: `${baseUrl}/api/players/${id}`
      });
      return {
        props: {
          error: errorData.error || 'Failed to load player data',
          player: null,
          stats: null,
          gameStats: [],
          playerHistory: []
        }
      };
    }

    const playerData = await playerRes.json();
    const history = historyRes.ok ? await historyRes.json() : [];

    console.log('Player API response:', {
      hasPlayer: !!playerData?.player,
      hasStats: !!playerData?.player?.season_averages,
      playerId: id,
      team: playerData?.player?.team?.full_name
    });

    if (!playerData?.player) {
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

    // Get recent games from the player data
    const recentGames = playerData.player.recent_games || [];

    return {
      props: {
        player: playerData.player,
        stats: playerData.player.season_averages,
        gameStats: recentGames,
        playerHistory: history,
        error: null
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', {
      message: error.message,
      stack: error.stack,
      playerId: params?.id
    });
    
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
