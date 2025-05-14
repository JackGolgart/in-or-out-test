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
import getTeamLogo from '../../lib/teamLogos';

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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error);
  const [showPlayoffs, setShowPlayoffs] = useState(player?.is_in_playoffs || false);
  const [playerData, setPlayerData] = useState(player);
  const [seasonStats, setSeasonStats] = useState(stats);
  const [recentGames, setRecentGames] = useState(gameStats);
  const [history, setHistory] = useState(playerHistory);

  // Update state when props change
  useEffect(() => {
    if (player) {
      setPlayerData(player);
      setSeasonStats(stats);
      setRecentGames(gameStats);
      setHistory(playerHistory);
      setShowPlayoffs(player.is_in_playoffs || false);
    }
  }, [player, stats, gameStats, playerHistory]);

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

  // Choose which averages to show
  const averages = showPlayoffs ? playerData.playoff_averages : playerData.regular_averages;
  const toggleLabel = showPlayoffs ? 'Playoff Averages' : 'Regular Season Averages';

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
          {/* Switch for regular/playoff averages */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Season Averages</h2>
            <div className="flex items-center space-x-2">
              <span className="text-white">Regular Season</span>
              <button
                onClick={() => setShowPlayoffs(!showPlayoffs)}
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
            {recentGames.length > 0 ? (
              <div className="space-y-4">
                {recentGames.map((game, index) => (
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
              <p className="text-gray-400 text-center py-8">No recent games available</p>
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
    
    // Fetch player data from our API endpoint
    const playerRes = await fetch(`${baseUrl}/api/players/${id}`);
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

    // Fetch player history
    let history = [];
    try {
      const historyRes = await fetch(`${baseUrl}/api/players/${id}/history`);
      if (historyRes.ok) {
        history = await historyRes.json();
      } else {
        console.error('Failed to fetch player history:', await historyRes.json());
      }
    } catch (historyError) {
      console.error('Error fetching player history:', historyError);
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
