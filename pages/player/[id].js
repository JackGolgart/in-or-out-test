import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination, Autoplay } from 'swiper/modules';
import api from '../../lib/bdlClient';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';

// Function to get current NBA season
function getCurrentNBASeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  
  // NBA season starts in October (month 10)
  // If we're before October, use previous year as the season start
  return month < 10 ? year - 1 : year;
}

export default function PlayerProfile({ player, stats, gameStats, playerHistory, error }) {
  const router = useRouter();

  if (error || !player) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Player Not Found</h1>
            <p className="text-gray-400">{error || "The player you're looking for doesn't exist or has been moved."}</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Return to Home
            </button>
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
                {player.first_name} {player.last_name}
              </h1>
              <p className="text-lg text-gray-300 mt-4">
                {player.position} — {player.team?.full_name}
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
                <h2 className="text-purple-300 text-lg font-semibold mb-4">NET Rating</h2>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    {stats?.net_rating ? stats.net_rating.toFixed(1) : 'N/A'}
                  </p>
                  {stats?.net_rating && (
                    <span className="text-sm text-gray-400">
                      points per 100 possessions
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-4">
                  Team's point differential per 100 possessions while the player is on court
                </p>
              </div>

              <div className="card-interactive">
                <h2 className="text-cyan-300 text-lg font-semibold mb-4">Current Season Stats</h2>
                {stats ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <p className="text-gray-300">
                        <span className="text-cyan-200">Minutes:</span> {stats.min}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-cyan-200">Points:</span> {stats.pts}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-cyan-200">Rebounds:</span> {stats.reb}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-gray-300">
                        <span className="text-cyan-200">Assists:</span> {stats.ast}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-cyan-200">Steals:</span> {stats.stl}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-cyan-200">Blocks:</span> {stats.blk}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No recent stats available</p>
                )}
              </div>
            </div>

            {/* Recent Games Carousel */}
            {gameStats.length > 0 && (
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
                  {gameStats.map((game, index) => (
                    <SwiperSlide key={index}>
                      <div className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-300">
                        <p className="text-gray-400 text-sm mb-2">{formatDate(game.game.date)}</p>
                        <p className="text-sm mb-1">
                          <span className="text-gray-400">vs </span>
                          <span className="text-white">{game.game.visitor_team_id === player.team.id ? game.game.home_team.abbreviation : game.game.visitor_team.abbreviation}</span>
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
                            <span className="text-purple-300">NET:</span> {game.net_rating?.toFixed(1) ?? 'N/A'}
                          </p>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}

            {/* Advanced Stats */}
            {stats && (
              <div className="card-interactive">
                <h3 className="text-lg font-bold text-white mb-6">Advanced Stats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-all duration-300">
                    <p className="text-gray-400 mb-2">Usage Rate</p>
                    <p className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                      {stats.usage_rate?.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-all duration-300">
                    <p className="text-gray-400 mb-2">True Shooting %</p>
                    <p className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                      {stats.ts_pct?.toFixed(3)}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-all duration-300">
                    <p className="text-gray-400 mb-2">Assist Ratio</p>
                    <p className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                      {stats.ast_ratio?.toFixed(1)}
                    </p>
                  </div>
                </div>
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
    
    // Fetch player data from our API endpoint
    const playerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/player/${id}`);
    if (!playerRes.ok) {
      const error = await playerRes.json();
      console.error('Player API error:', error);
      return {
        props: {
          error: error.error || 'Failed to load player data',
          player: null,
          stats: null,
          gameStats: [],
          playerHistory: []
        }
      };
    }

    const { player, seasonAverages } = await playerRes.json();
    if (!player) {
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
    const historyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/players/${id}/history`);
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
