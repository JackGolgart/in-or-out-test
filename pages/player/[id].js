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
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error);
  const [showPlayoffs, setShowPlayoffs] = useState(false);
  const [playerData, setPlayerData] = useState(player);
  const [seasonStats, setSeasonStats] = useState(stats);
  const [recentGames, setRecentGames] = useState(gameStats);
  const [history, setHistory] = useState(playerHistory);
  const [prediction, setPrediction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update state when props change
  useEffect(() => {
    if (player) {
      console.log('Initial player data:', {
        id: player.id,
        name: `${player.first_name} ${player.last_name}`,
        regularNetRating: player.regular_net_rating,
        playoffNetRating: player.playoff_net_rating,
        hasRegularNetRating: player.regular_net_rating !== undefined && player.regular_net_rating !== null,
        hasPlayoffNetRating: player.playoff_net_rating !== undefined && player.playoff_net_rating !== null,
        allPlayerKeys: Object.keys(player)
      });
      
      // Initialize player data with default values if needed
      const initializedPlayer = {
        ...player,
        regular_net_rating: player.regular_net_rating ?? 0,
        playoff_net_rating: player.playoff_net_rating ?? 0,
        regular_averages: player.regular_averages ?? { points: 0, rebounds: 0, assists: 0, games_played: 0 },
        playoff_averages: player.playoff_averages ?? { points: 0, rebounds: 0, assists: 0, games_played: 0 },
        recent_games: player.recent_games ?? []
      };
      
      setPlayerData(initializedPlayer);
      setShowPlayoffs(false); // Default to regular season
    }
  }, [player]);

  // Get the correct net rating based on game type
  const currentNetRating = useMemo(() => {
    if (!playerData) {
      console.log('No player data available for net rating calculation');
      return 0;
    }
    
    const rating = showPlayoffs ? playerData.playoff_net_rating : playerData.regular_net_rating;
    console.log('Net rating calculation:', {
      showPlayoffs,
      regularNetRating: playerData.regular_net_rating,
      playoffNetRating: playerData.playoff_net_rating,
      selectedRating: rating,
      playerDataKeys: Object.keys(playerData)
    });
    
    return rating ?? 0;
  }, [playerData, showPlayoffs]);

  // Debug log for currentNetRating and playerData
  useEffect(() => {
    if (playerData) {
      console.log('DEBUG: currentNetRating value:', {
        value: currentNetRating,
        type: typeof currentNetRating,
        isNull: currentNetRating === null,
        isUndefined: currentNetRating === undefined,
        playerData: {
          regularNetRating: playerData.regular_net_rating,
          playoffNetRating: playerData.playoff_net_rating,
          showPlayoffs,
          allKeys: Object.keys(playerData)
        }
      });
    }
  }, [currentNetRating, playerData, showPlayoffs]);

  // Update averages based on showPlayoffs state
  const averages = useMemo(() => {
    if (!playerData) return null;
    return showPlayoffs ? playerData.playoff_averages : playerData.regular_averages;
  }, [playerData, showPlayoffs]);

  // Filter recent games based on showPlayoffs state
  const filteredRecentGames = useMemo(() => {
    if (!playerData?.recent_games) return [];
    return playerData.recent_games.filter(game => game.isPlayoff === showPlayoffs);
  }, [playerData?.recent_games, showPlayoffs]);

  // Fetch prediction only when user or player ID changes
  useEffect(() => {
    if (user && player?.id) {
      fetchPrediction();
    }
  }, [user, player?.id]);

  const fetchPrediction = async () => {
    if (!user || !session) {
      console.log('No user or session found, skipping prediction fetch');
      return;
    }

    try {
      console.log('Fetching prediction with session:', session?.user?.id);
      const response = await fetch('/api/predictions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.status === 401) {
        console.log('User is not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch prediction');
      }

      const data = await response.json();
      const playerPrediction = data.find(p => p.player_id === player.id);
      setPrediction(playerPrediction);
    } catch (error) {
      console.error('Error fetching prediction:', error);
      setErrorMessage(error.message);
    }
  };

  const handlePrediction = async (type) => {
    if (!user || !session) {
      console.log('No user or session found, redirecting to login');
      router.push('/login');
      return;
    }

    if (!player?.id) {
      console.error('Missing player ID');
      setErrorMessage('Missing player data');
      return;
    }

    if (currentNetRating === undefined || currentNetRating === null) {
      console.error('Missing net rating data');
      setErrorMessage('Net rating data is not available for this player');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Saving prediction with session:', session?.user?.id);
      console.log('Prediction data:', {
        player_id: player.id,
        prediction_type: type,
        net_rating: currentNetRating
      });

      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          player_id: player.id,
          prediction_type: type,
          net_rating: currentNetRating
        })
      });

      if (response.status === 401) {
        console.log('User is not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Prediction API error:', errorData);
        throw new Error(errorData.error || 'Failed to save prediction');
      }

      const data = await response.json();
      console.log('Prediction saved successfully:', data);
      setPrediction(data);
    } catch (error) {
      console.error('Error saving prediction:', error);
      setErrorMessage(error.message);
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

  useEffect(() => {
    if (player) {
      console.log('Player data loaded:', {
        id: player.id,
        name: `${player.first_name} ${player.last_name}`,
        regularNetRating: player.regular_net_rating,
        playoffNetRating: player.playoff_net_rating,
        hasRegularNetRating: player.regular_net_rating !== undefined && player.regular_net_rating !== null,
        hasPlayoffNetRating: player.playoff_net_rating !== undefined && player.playoff_net_rating !== null
      });
    }
  }, [player]);

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
          {/* Debug log for currentNetRating and playerData */}
          {(() => {
            console.log('DEBUG: currentNetRating value:', currentNetRating, 'type:', typeof currentNetRating);
            console.log('DEBUG: playerData:', playerData);
            return null;
          })()}
          {/* Prediction Buttons */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Make Your Prediction</h2>
            {!user ? (
              <div className="text-center py-4">
                <p className="text-gray-400">Please log in to make predictions</p>
                <button
                  onClick={() => router.push('/login')}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Log In
                </button>
              </div>
            ) : currentNetRating === undefined || currentNetRating === null ? (
              <div className="text-center py-4">
                <p className="text-gray-400">Net rating data is not available for this player</p>
                <p className="text-sm text-gray-500 mt-2">
                  This could be because the player hasn't played enough games this season or the data hasn't been updated yet.
                </p>
              </div>
            ) : (
              <>
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
              </>
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
              <span className="text-3xl font-bold text-white block mb-2">
                {playerData?.regular_net_rating !== null && playerData?.regular_net_rating !== undefined
                  ? playerData.regular_net_rating.toFixed(1)
                  : '0.0'}
              </span>
              <span className="text-gray-400">Net Rating</span>
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
    
    console.log('Making API calls:', {
      playerUrl: `${baseUrl}/api/players/${id}`,
      historyUrl: `${baseUrl}/api/players/${id}/history`
    });
    
    // Fetch player data and history in parallel
    const [playerRes, historyRes] = await Promise.all([
      fetch(`${baseUrl}/api/players/${id}`),
      fetch(`${baseUrl}/api/players/${id}/history`)
    ]);

    console.log('API responses:', {
      playerStatus: playerRes.status,
      playerOk: playerRes.ok,
      historyStatus: historyRes.status,
      historyOk: historyRes.ok
    });

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

    // Get recent games from the player data and ensure they're serializable
    const recentGames = (playerData.player.recent_games || []).map(game => ({
      date: game.date || null,
      isPlayoff: game.isPlayoff || false,
      gameType: game.gameType || 'Regular Season',
      result: game.result || 'N/A',
      score: game.score || '0-0',
      points: game.points || 0,
      rebounds: game.rebounds || 0,
      assists: game.assists || 0,
      minutes: game.minutes || '0'
    }));

    // Ensure all stats are serializable
    const stats = {
      points: playerData.player.regular_averages?.points || 0,
      rebounds: playerData.player.regular_averages?.rebounds || 0,
      assists: playerData.player.regular_averages?.assists || 0,
      games_played: playerData.player.regular_averages?.games_played || 0
    };

    // Ensure player data is serializable
    const player = {
      ...playerData.player,
      regular_net_rating: playerData.player.regular_net_rating || 0,
      playoff_net_rating: playerData.player.playoff_net_rating || 0,
      regular_averages: {
        points: playerData.player.regular_averages?.points || 0,
        rebounds: playerData.player.regular_averages?.rebounds || 0,
        assists: playerData.player.regular_averages?.assists || 0,
        games_played: playerData.player.regular_averages?.games_played || 0
      },
      playoff_averages: {
        points: playerData.player.playoff_averages?.points || 0,
        rebounds: playerData.player.playoff_averages?.rebounds || 0,
        assists: playerData.player.playoff_averages?.assists || 0,
        games_played: playerData.player.playoff_averages?.games_played || 0
      },
      recent_games: recentGames
    };

    return {
      props: {
        player,
        stats,
        gameStats: recentGames,
        playerHistory: history || [],
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