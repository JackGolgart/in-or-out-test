'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import JerseyAvatar from '../components/JerseyAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import Link from 'next/link';
import styles from '../styles/Search.module.css';

const getNetRatingColor = (rating) => {
  if (!rating && rating !== 0) return 'text-gray-400';
  if (rating > 5) return 'text-green-400';
  if (rating > 0) return 'text-emerald-400';
  if (rating < -5) return 'text-red-400';
  if (rating < 0) return 'text-orange-400';
  return 'text-yellow-400';
};

const PlayerCard = ({ player, onClick }) => {
  if (!player || !player.id || !player.first_name || !player.last_name || !player.team) {
    return null;
  }

  return (
    <div 
      onClick={onClick}
      className="card-interactive group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <JerseyAvatar
            teamAbbr={player.team.abbreviation}
            firstName={player.first_name}
            lastName={player.last_name}
            size="sm"
          />
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors duration-300">
              {player.first_name} {player.last_name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">{player.position}</span>
              <span className="text-gray-600">•</span>
              <span className="text-sm font-medium text-gray-300">{player.team.full_name}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-6">
          <div className="text-center">
            <span className="text-white font-medium block">{player.pts?.toFixed(1) || '0.0'}</span>
            <span className="text-gray-400 text-sm">PPG</span>
          </div>
          <div className="text-center">
            <span className="text-white font-medium block">{player.reb?.toFixed(1) || '0.0'}</span>
            <span className="text-gray-400 text-sm">RPG</span>
          </div>
          <div className="text-center">
            <span className="text-white font-medium block">{player.ast?.toFixed(1) || '0.0'}</span>
            <span className="text-gray-400 text-sm">APG</span>
          </div>
          <div className="text-center">
            <span className={`text-white font-medium block ${getNetRatingColor(player.net_rating)}`}>
              {player.net_rating !== undefined && player.net_rating !== null ? player.net_rating.toFixed(1) : '0.0'}
            </span>
            <span className="text-gray-400 text-sm">Net Rating</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SearchPage() {
  const router = useRouter();
  const { q: query } = router.query;
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPlayerId, setLoadingPlayerId] = useState(null);

  const handlePlayerClick = (playerId) => {
    setLoadingPlayerId(playerId);
  };

  useEffect(() => {
    if (!query) {
      router.push('/');
      return;
    }

    const fetchPlayers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          per_page: '25',
          page: page.toString(),
          search: query
        });

        const response = await fetch(`/api/players?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch players');
        }

        if (!data.data || !Array.isArray(data.data)) {
          console.error('Invalid API response:', data);
          throw new Error('Invalid response format from server');
        }

        const newPlayers = data.data.filter(player => 
          player && 
          typeof player === 'object' && 
          player.id && 
          player.first_name && 
          player.last_name && 
          player.team
        );

        console.log('Search results:', {
          query,
          totalResults: data.data.length,
          validResults: newPlayers.length,
          firstPlayer: newPlayers[0]
        });

        setPlayers(prev => page === 1 ? newPlayers : [...prev, ...newPlayers]);
        
        if (data.meta) {
          setHasMore(data.meta.current_page < data.meta.total_pages);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError(err.message);
        setPlayers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, [query, page, router]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        {/* Search Header */}
        <div className="bg-gray-900/80 border-b border-gray-800 sticky top-16 z-10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Search Results for "{query}"
              </h2>
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Back to Search
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => setPage(1)}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Players Grid */}
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading && players.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card-base animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : players.length > 0 ? (
                  players.map((player) => (
                    <Link 
                      key={player.id} 
                      href={`/player/${player.id}`}
                      onClick={() => handlePlayerClick(player.id)}
                      className="card-interactive group cursor-pointer relative"
                    >
                      {loadingPlayerId === player.id && (
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                          <LoadingSpinner size="md" />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <JerseyAvatar
                            teamAbbr={player.team.abbreviation}
                            firstName={player.first_name}
                            lastName={player.last_name}
                            size="sm"
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors duration-300">
                              {player.first_name} {player.last_name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-400">{player.position}</span>
                              <span className="text-gray-600">•</span>
                              <span className="text-sm font-medium text-gray-300">{player.team.full_name}</span>
                            </div>
                          </div>
                        </div>
                        {player.pts !== undefined && (
                          <div className="flex space-x-6">
                            <div className="text-center">
                              <span className="text-white font-medium block">{player.pts}</span>
                              <span className="text-gray-400 text-sm">PPG</span>
                            </div>
                            <div className="text-center">
                              <span className="text-white font-medium block">{player.reb}</span>
                              <span className="text-gray-400 text-sm">RPG</span>
                            </div>
                            <div className="text-center">
                              <span className="text-white font-medium block">{player.ast}</span>
                              <span className="text-gray-400 text-sm">APG</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-400">No players found matching "{query}"</p>
                    <button
                      onClick={() => router.push('/')}
                      className="mt-4 btn-primary"
                    >
                      Try a different search
                    </button>
                  </div>
                )}
              </div>

              {/* Load More Button */}
              {hasMore && players.length > 0 && (
                <div className="text-center mt-12">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Load More Players'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
} 