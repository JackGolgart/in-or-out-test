'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import api from '../lib/bdlClient';
import Layout from '../components/Layout';
import JerseyAvatar from '../components/JerseyAvatar';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import { trackComponentRender } from '../utils/performance';

const SearchSection = ({ query, setQuery, searchMessage }) => (
  <div className="bg-gray-900/80 border-b border-gray-800 sticky top-16 z-10 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Search Players</h2>
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by player name..."
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
          />
          {searchMessage && (
            <p className="mt-2 text-sm text-gray-400">{searchMessage}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const PlayerCard = ({ player, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-all cursor-pointer border border-gray-700/50 hover:border-purple-500/50"
  >
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12">
        <JerseyAvatar
          teamAbbr={player.team.abbreviation}
          firstName={player.first_name}
          lastName={player.last_name}
          className="w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white text-sm font-medium truncate">
          {player.first_name} {player.last_name}
        </h3>
        <p className="text-gray-400 text-xs truncate">{player.team.full_name}</p>
      </div>
      <div className="text-right">
        <div className="text-purple-400 text-sm font-medium">
          {player.net_rating !== null ? player.net_rating.toFixed(1) : 'N/A'}
        </div>
        <p className="text-gray-500 text-xs">NET</p>
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [renderStart] = useState(Date.now());
  const [searchMessage, setSearchMessage] = useState('');
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ total_pages: 1, current_page: 1, next_page: null });

  useEffect(() => {
    return () => {
      trackComponentRender('HomePage', Date.now() - renderStart);
    };
  }, [renderStart]);

  useEffect(() => {
    if (query.length > 0 && query.length < 3) {
      setSearchMessage('Type at least 3 characters to search');
    } else {
      setSearchMessage('');
    }

    const delay = setTimeout(() => {
      if (query.length === 0 || query.length >= 3) {
        fetchPlayers(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    const cached = localStorage.getItem('cached_players');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const valid = parsed.every(p => p.id && p.first_name && p.team?.abbreviation);
        if (valid) {
          setPlayers(parsed);
        } else {
          localStorage.removeItem('cached_players');
        }
      } catch {
        localStorage.removeItem('cached_players');
      }
    }
  }, []);

  const fetchPlayers = async (isLoadMore = false) => {
    setIsLoading(true);
    setError(null);
    
    const maxRetries = 3;
    let currentTry = 0;

    while (currentTry < maxRetries) {
      try {
        const params = new URLSearchParams({
          per_page: '25',
          page: isLoadMore ? (page + 1).toString() : '1',
        });
        
        if (query.length > 2) params.append('search', query);

        const response = await fetch(`/api/players?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        let data;
        try {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Failed to parse response as JSON:', text);
            throw new Error('Invalid server response format');
          }
        } catch (e) {
          console.error('Failed to read response:', e);
          throw new Error('Failed to read server response');
        }

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('API key is invalid or missing. Please check your configuration.');
          }
          const errorMessage = typeof data.error === 'string' 
            ? data.error 
            : typeof data.error === 'object' 
              ? JSON.stringify(data.error) 
              : `Server error: ${response.status}`;
          throw new Error(errorMessage);
        }
        
        if (!data.data) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format from server');
        }

        const newPlayers = Array.isArray(data.data) ? data.data : [];
        
        if (data.meta) {
          setMeta(data.meta);
          setHasMore(data.meta.current_page < data.meta.total_pages);
        }

        const updatedPlayers = isLoadMore ? [...players, ...newPlayers] : newPlayers;
        setPlayers(updatedPlayers);
        
        // Only cache if we have valid data
        if (updatedPlayers.length > 0) {
          localStorage.setItem('cached_players', JSON.stringify(updatedPlayers));
        }
        
        setPage(isLoadMore ? page + 1 : 1);
        break; // Success, exit the retry loop
      } catch (err) {
        console.error("Failed to fetch players:", err);
        currentTry++;
        
        if (currentTry === maxRetries) {
          const errorMessage = err.message && err.message !== '[object Object]'
            ? err.message
            : 'Failed to fetch players. Please try again later.';
          setError(errorMessage);
          if (!isLoadMore) setPlayers([]);
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, currentTry) * 1000));
        }
      }
    }
    
    setIsLoading(false);
  };

  return (
    <Layout>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
          {/* Header */}
          <div className="relative bg-gray-900/95 border-b border-gray-800/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  NBA Player Analytics
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                  Track performance metrics and discover insights
                </p>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <SearchSection
            query={query}
            setQuery={setQuery}
            searchMessage={searchMessage}
          />

          {/* Content Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <div className="mb-8">
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3">
                  <p className="text-red-400 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {players.map(player => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onClick={() => router.push(`/player/${player.id}`)}
                />
              ))}
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner 
                  size="lg"
                  message={players.length > 0 ? "Loading more players..." : "Searching players..."}
                />
              </div>
            )}

            {!isLoading && players.length > 0 && hasMore && (
              <div className="text-center py-8">
                <button
                  onClick={() => fetchPlayers(true)}
                  className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-sm font-medium px-6 py-3 rounded-lg border border-purple-600/30 hover:border-purple-600/50 transition-all duration-300"
                >
                  Load More ({meta.current_page}/{meta.total_pages})
                </button>
              </div>
            )}

            {!isLoading && players.length === 0 && !error && (
              <div className="flex items-center justify-center py-16">
                <div className="bg-gray-800/50 rounded-lg p-8 max-w-md w-full border border-gray-700/50 text-center">
                  <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-400 text-lg font-medium mb-2">No players found</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </Layout>
  );
}