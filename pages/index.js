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

const FilterButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      active
        ? 'bg-purple-600 text-white'
        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
    }`}
  >
    {children}
  </button>
);

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

const getNetRatingColor = (rating) => {
  if (!rating && rating !== 0) return 'text-gray-400';
  if (rating > 5) return 'text-green-400';
  if (rating > 0) return 'text-emerald-400';
  if (rating < -5) return 'text-red-400';
  if (rating < 0) return 'text-orange-400';
  return 'text-yellow-400';
};

const PlayerCard = ({ player, onClick }) => {
  // Add debugging
  console.log('PlayerCard render:', {
    playerId: player?.id,
    playerName: player ? `${player.first_name} ${player.last_name}` : 'Unknown',
    netRating: player?.net_rating,
    hasNetRating: player?.net_rating !== undefined && player?.net_rating !== null,
    team: player?.team
  });

  if (!player || !player.id || !player.first_name || !player.last_name || !player.team) {
    console.error('Invalid player data:', player);
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
            <p className="text-sm text-gray-400">
              {player.team.full_name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">
            Net Rating {player.season ? `(${player.season}-${player.season + 1})` : ''}
          </p>
          <p className={`text-lg font-semibold ${getNetRatingColor(player.net_rating)}`}>
            {player.net_rating !== undefined && player.net_rating !== null ? player.net_rating.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [renderStart] = useState(Date.now());
  const [searchMessage, setSearchMessage] = useState('');
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('INS - 24H');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid teams response format');
        }
        setTeams(['All Teams', ...data.map(team => team.full_name)]);
      } catch (error) {
        console.error('Error fetching teams:', error);
        // Set default teams list on error
        setTeams(['All Teams']);
      }
    };
    fetchTeams();
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Pick Your Players
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-12">
                Search NBA players, filter by team, and track top picks!
              </p>
              
              {/* Search Section */}
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search players by name..."
                      className="input-primary h-12"
                    />
                  </div>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="input-primary h-12 sm:w-48"
                  >
                    {teams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
                {searchMessage && (
                  <p className="mt-2 text-sm text-gray-400">{searchMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => fetchPlayers(false)}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Trending Players
                </h2>
                <div className="flex flex-wrap gap-2">
                  <FilterButton
                    active={activeFilter === 'INS - 24H'}
                    onClick={() => setActiveFilter('INS - 24H')}
                  >
                    INS - 24H
                  </FilterButton>
                  <FilterButton
                    active={activeFilter === 'OUTS - 24H'}
                    onClick={() => setActiveFilter('OUTS - 24H')}
                  >
                    OUTS - 24H
                  </FilterButton>
                  <FilterButton
                    active={activeFilter === 'INS - 7D'}
                    onClick={() => setActiveFilter('INS - 7D')}
                  >
                    INS - 7D
                  </FilterButton>
                  <FilterButton
                    active={activeFilter === 'OUTS - 7D'}
                    onClick={() => setActiveFilter('OUTS - 7D')}
                  >
                    OUTS - 7D
                  </FilterButton>
                </div>
              </div>

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
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onClick={() => router.push(`/player/${player.id}`)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-400">No players found</p>
                  </div>
                )}
              </div>

              {/* Load More Button */}
              {hasMore && players.length > 0 && (
                <div className="text-center mt-12">
                  <button
                    onClick={() => fetchPlayers(true)}
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