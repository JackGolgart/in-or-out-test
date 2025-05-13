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
import { teams } from '../config/teams';

const SearchSection = ({ query, setQuery, searchMessage }) => (
  <div className="bg-gray-900/50 border-b border-gray-800 sticky top-[72px] z-10 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="flex items-center">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Search players..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              aria-label="Search players"
              minLength={3}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchMessage && (
            <p className="text-xs text-gray-500 mt-1 ml-1">{searchMessage}</p>
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
          {player.netRating !== null ? player.netRating.toFixed(1) : 'N/A'}
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
    try {
      const params = new URLSearchParams({
        per_page: '25',
        page: isLoadMore ? (page + 1).toString() : '1',
      });
      
      if (query.length > 2) params.append('search', query);

      const response = await fetch(`/api/players?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
      }
      
      if (!data.data) {
        throw new Error('Invalid response format');
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
    } catch (err) {
      console.error("Failed to fetch players:", err);
      setError(err.message || "Failed to fetch players. Please try again later.");
      if (!isLoadMore) setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-900">
          {/* Header */}
          <div className="relative bg-gray-900 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex flex-col space-y-2">
                <h1 className="text-2xl font-bold text-white">
                  NBA Player Analytics
                </h1>
                <p className="text-gray-400 text-sm">
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
          <div className="max-w-7xl mx-auto px-4 py-6">
            {error && (
              <div className="mb-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map(player => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onClick={() => router.push(`/player/${player.id}`)}
                />
              ))}
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner 
                  size="md"
                  message={players.length > 0 ? "Loading more..." : "Searching..."}
                />
              </div>
            )}

            {!isLoading && players.length > 0 && hasMore && (
              <div className="text-center py-6">
                <button
                  onClick={() => fetchPlayers(true)}
                  className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-sm font-medium px-6 py-2 rounded-lg border border-purple-600/30 hover:border-purple-600/50 transition-all"
                >
                  Load More ({meta.current_page}/{meta.total_pages})
                </button>
              </div>
            )}

            {!isLoading && players.length === 0 && !error && (
              <div className="text-center py-12">
                <div className="bg-gray-800/50 rounded-lg p-8 max-w-md mx-auto border border-gray-700/50">
                  <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-400 text-sm mb-1">No players found</p>
                  <p className="text-gray-500 text-xs">Try adjusting your search criteria</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </Layout>
  );
}