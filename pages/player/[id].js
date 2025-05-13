import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination, Autoplay } from 'swiper/modules';
import api from '../../lib/bdlClient';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PlayerProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [gameStats, setGameStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch player details
        const playerRes = await api.nba.getPlayers({ per_page: 1, search: id });
        if (!playerRes.data?.[0]) {
          throw new Error('Player not found');
        }
        const playerData = playerRes.data[0];
        setPlayer(playerData);

        // Fetch player stats and advanced stats
        const [statsRes, advancedStatsRes] = await Promise.all([
          api.nba.getStats({ 
            player_ids: [id],
            seasons: [2023],
            per_page: 100
          }),
          fetch(`https://api.balldontlie.io/v2/stats/advanced?player_ids[]=${id}&seasons[]=${2023}&per_page=100`, {
            headers: {
              Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
            },
          })
        ]);

        const advancedStats = await advancedStatsRes.json();

        if (statsRes.data?.length > 0) {
          // Get the most recent stats
          const mostRecentStats = statsRes.data.reduce((latest, current) => {
            if (!latest || new Date(current.game.date) > new Date(latest.game.date)) {
              return current;
            }
            return latest;
          }, null);

          // Combine regular stats with advanced stats
          const combinedStats = {
            ...mostRecentStats,
            ...advancedStats.data?.[0]
          };

          setStats(combinedStats);
          
          // Store last 10 games for the stats carousel
          const sortedGames = statsRes.data
            .sort((a, b) => new Date(b.game.date) - new Date(a.game.date))
            .slice(0, 10);
          setGameStats(sortedGames);
        }
      } catch (err) {
        console.error('Error fetching player data:', err);
        setError(err.message || 'Failed to load player data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading player data..." />
        </div>
      </Layout>
    );
  }

  if (error || !player) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
          <div className="text-red-500 bg-red-900/20 rounded-xl px-6 py-4">
            {error || 'Player not found'}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              {player.first_name} {player.last_name}
            </h1>
            <p className="text-gray-400 mt-2">{player.position} — {player.team?.full_name}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl border border-purple-500/30 shadow-md hover:shadow-purple-500/10 transition-all duration-300">
              <h2 className="text-purple-300 text-lg font-semibold mb-2">NET Rating</h2>
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

            <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl border border-cyan-500/30 shadow-md hover:shadow-cyan-500/10 transition-all duration-300">
              <h2 className="text-cyan-300 text-lg font-semibold mb-2">Current Season Stats</h2>
              {stats ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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

          {gameStats.length > 0 && (
            <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-600">
              <h3 className="text-white text-lg font-bold mb-6">Recent Games</h3>
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

          {stats && (
            <div className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-600">
              <h3 className="text-white text-lg font-bold mb-4">Advanced Stats</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
                <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-all duration-300">
                  <p className="text-gray-400">Usage Rate</p>
                  <p className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    {stats.usage_rate?.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-all duration-300">
                  <p className="text-gray-400">True Shooting %</p>
                  <p className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    {stats.ts_pct?.toFixed(3)}
                  </p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-all duration-300">
                  <p className="text-gray-400">Assist Ratio</p>
                  <p className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    {stats.ast_ratio?.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { id } = params;

  try {
    const res = await fetch(`https://api.balldontlie.io/v2/players/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
      },
    });

    const player = await res.json();
    if (!player || !player.id) return { notFound: true };

    const advancedStatsRes = await fetch(`https://api.balldontlie.io/v1/stats/advanced?player_ids[]=${id}`);
    const advancedStats = await advancedStatsRes.json();

    let stats = null;
    let netRating = null;

    if (advancedStats.data.length > 0) {
      const recentStats = advancedStats.data[0];
      stats = recentStats;
      netRating = recentStats.net_rating;
    }

    return {
      props: {
        player,
        stats,
        netRating,
      },
      revalidate: 86400,
    };
  } catch (err) {
    console.error('Error fetching player:', err.message);
    return { notFound: true };
  }
}
