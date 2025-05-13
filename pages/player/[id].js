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

  // Choose which averages to show
  const averages = showPlayoff ? player.playoff_averages : player.regular_averages;
  const toggleLabel = showPlayoff ? 'Playoff Averages' : 'Regular Season Averages';

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/search" className={styles.backLink}>
            ← Back to Search
          </Link>
          <h1>{player.first_name} {player.last_name}</h1>
          <div className={styles.teamInfo}>
            <h2>{player.team?.full_name || 'No Team'}</h2>
            <p>#{player.jersey_number} | {player.position}</p>
          </div>
        </div>

        {/* Switch for regular/playoff averages */}
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>Regular Season</span>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={showPlayoff}
              onChange={() => setShowPlayoff((v) => !v)}
            />
            <span className={styles.slider}></span>
          </label>
          <span className={styles.toggleLabel}>Playoffs</span>
        </div>

        <div className={styles.stats}>
          <h3>{toggleLabel}</h3>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{averages.points.toFixed(1)}</span>
              <span className={styles.statLabel}>Points</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{averages.rebounds.toFixed(1)}</span>
              <span className={styles.statLabel}>Rebounds</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{averages.assists.toFixed(1)}</span>
              <span className={styles.statLabel}>Assists</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{averages.games_played}</span>
              <span className={styles.statLabel}>Games</span>
            </div>
          </div>
        </div>

        <div className={styles.recentGames}>
          <h3>Recent Games</h3>
          {player.recent_games.length > 0 ? (
            <div className={styles.gamesList}>
              {player.recent_games.map((game, index) => (
                <div key={index} className={styles.game}>
                  <div className={styles.gameDate}>{formatDate(game.date)}</div>
                  <div className={styles.gameResult}>
                    <span className={styles.result}>{game.result}</span>
                    <span className={styles.score}>{game.score}</span>
                  </div>
                  <div className={styles.gameStats}>
                    <span>{game.points} pts</span>
                    <span>{game.rebounds} reb</span>
                    <span>{game.assists} ast</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent games available</p>
          )}
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
