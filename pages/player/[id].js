import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination, Autoplay } from 'swiper/modules';
import api from '../../lib/bdlClient';
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

  useEffect(() => {
    if (!id) return;

    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/players/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch player data');
        }
        const data = await response.json();
        setPlayer(data);
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
        <div className={styles.container}>
          <div className={styles.loading}>
            <LoadingSpinner size="lg" />
            <p>Loading player data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Error</h2>
            <p>{error}</p>
            <Link href="/search" className={styles.backLink}>
              Back to Search
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!player) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Player Not Found</h2>
            <p>The requested player could not be found.</p>
            <Link href="/search" className={styles.backLink}>
              Back to Search
            </Link>
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
        {/* Hero Section with gradient overlay */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                {player.player.first_name} {player.player.last_name}
              </h1>
              <p className="text-lg text-gray-300 mt-4">
                {player.player.position} — {player.player.team?.full_name}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8">
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-interactive">
                <h2 className="text-purple-300 text-lg font-semibold mb-4">Season Averages</h2>
                {player.seasonAverages ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <p className="text-gray-300">
                        <span className="text-purple-300">Points:</span> {player.seasonAverages.pts}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-purple-300">Rebounds:</span> {player.seasonAverages.reb}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-purple-300">Assists:</span> {player.seasonAverages.ast}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-gray-300">
                        <span className="text-purple-300">Minutes:</span> {player.seasonAverages.min}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-purple-300">Games:</span> {player.seasonAverages.games_played}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-purple-300">FG%:</span> {(player.seasonAverages.fg_pct * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No season stats available</p>
                )}
              </div>

              <div className="card-interactive">
                <h2 className="text-cyan-300 text-lg font-semibold mb-4">Player Info</h2>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-300">
                    <span className="text-cyan-300">Height:</span> {player.player.height}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-cyan-300">Weight:</span> {player.player.weight} lbs
                  </p>
                  <p className="text-gray-300">
                    <span className="text-cyan-300">Jersey:</span> #{player.player.jersey_number}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-cyan-300">College:</span> {player.player.college || 'N/A'}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-cyan-300">Country:</span> {player.player.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Games */}
            {player.gameStats && player.gameStats.length > 0 && (
              <div className="card-interactive">
                <h3 className="text-lg font-bold text-white mb-6">Recent Games</h3>
                <Swiper
                  modules={[Pagination, Autoplay]}
                  spaceBetween={20}
                  slidesPerView={1}
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 3000, disableOnInteraction: false }}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 }
                  }}
                  className="pb-10"
                >
                  {player.gameStats.map((game, index) => (
                    <SwiperSlide key={index}>
                      <div className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-300">
                        <p className="text-gray-400 text-sm mb-2">{formatDate(game.game.date)}</p>
                        <p className="text-sm mb-1">
                          <span className="text-gray-400">vs </span>
                          <span className="text-white">{game.game.visitor_team_id === player.player.team.id ? game.game.home_team.abbreviation : game.game.visitor_team.abbreviation}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                          <p className="text-gray-300">
                            <span className="text-purple-300">PTS:</span> {game.pts}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-purple-300">REB:</span> {game.reb}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-purple-300">AST:</span> {game.ast}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-purple-300">MIN:</span> {game.min}
                          </p>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
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
    const statsRes = await api.nba.getStats({ 
      player_ids: [parseInt(id)],
      seasons: [currentSeason],
      per_page: 10
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
