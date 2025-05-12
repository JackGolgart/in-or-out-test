'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import api from '../lib/bdlClient';
import Layout from '../components/Layout';
import JerseyAvatar from '../components/JerseyAvatar';
import { trackComponentRender } from '../utils/performance';
import { teams } from '../config/teams';

const SearchSection = ({ query, setQuery, selectedTeam, setSelectedTeam, searchMessage }) => (
  <div className="bg-gray-850 border-b border-gray-700 sticky top-[72px] z-10 backdrop-blur-sm bg-opacity-90 transition-all duration-300">
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative group">
            <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <input
                type="text"
                className="input-primary pr-10"
                placeholder="Search players by name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                aria-label="Search players"
                minLength={3}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {searchMessage && (
            <p className="text-sm text-gray-400 mt-1 ml-1 transition-all duration-300">{searchMessage}</p>
          )}
        </div>
        <div className="md:w-64">
          <div className="relative group">
            <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="input-primary appearance-none"
                aria-label="Filter by team"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [renderStart] = useState(Date.now());
  const [searchMessage, setSearchMessage] = useState('');

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
  }, [query, selectedTeam]);

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
    try {
      const options = {
        per_page: 10,
        page: isLoadMore ? page + 1 : 1,
      };
      if (query.length > 2) options.search = query;
      if (selectedTeam) options.team_ids = [parseInt(selectedTeam)];

      const response = await api.nba.getPlayers(options);
      const newPlayers = Array.isArray(response.data) ? response.data : [];

      const ids = newPlayers.map(p => p.id);
      const statsRes = await api.nba.getPlayerStats({ player_ids: ids, season: 2023 });
      const statsMap = new Map(statsRes.data.map(stats => [stats.player_id, stats]));

      const playerStats = newPlayers.map(player => {
        const stats = statsMap.get(player.id);
        return {
          ...player,
          netRating: stats?.net_rating ?? null
        };
      });

      const updatedPlayers = isLoadMore ? [...players, ...playerStats] : playerStats;
      setPlayers(updatedPlayers);
      localStorage.setItem('cached_players', JSON.stringify(updatedPlayers));
      setPage(isLoadMore ? page + 1 : 1);
      setHasMore(newPlayers.length === 10);
    } catch (error) {
      console.error("Failed to fetch players:", error);
      if (!isLoadMore) setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlayerCard = (player) => {
    if (!player) return null;
    return (
      <div className="p-4 bg-gray-800 rounded text-center shadow-md flex flex-col items-center">
        <div className="mb-2">
          <JerseyAvatar
            teamAbbr={player.team.abbreviation}
            firstName={player.first_name}
            lastName={player.last_name}
          />
        </div>
        <h3 className="text-white text-lg">{player.first_name} {player.last_name}</h3>
        <p className="text-gray-400 text-xs">{player.team.full_name}</p>
        <p className="text-purple-300 text-sm mt-1">NET Rating: {player.netRating !== null ? player.netRating.toFixed(1) : 'N/A'}</p>
        <p className="text-gray-400 text-xs">Position: {player.position || 'N/A'}</p>
        <button
          onClick={() => router.push(`/player/${player.id}`)}
          className="mt-2 px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
        >
          View
        </button>
      </div>
    );
  };

  return (
    <Layout>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-850 to-black">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-purple-900 py-16">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
              <div className="absolute inset-0 bg-[url('/basketball-pattern.svg')] opacity-10"></div>
            </div>
            <div className="relative max-w-6xl mx-auto px-4">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                NBA Player Stats
              </h1>
              <p className="text-lg md:text-xl text-gray-200 max-w-2xl">
                Track performance, analyze statistics, and discover player ratings in the NBA.
              </p>
            </div>
          </div>

          {/* Search Section */}
          <SearchSection
            query={query}
            setQuery={setQuery}
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
            searchMessage={searchMessage}
          />

          {/* Content Section */}
          <div className="max-w-6xl mx-auto px-4 py-8">
            {error && (
              <div className="text-center mb-8">
                <div className="bg-red-900/20 rounded-xl px-6 py-4 inline-block">
                  <p className="text-red-400 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {players.map(player => renderPlayerCard(player))}
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
              <div className="text-center pb-8">
                <button
                  onClick={() => fetchPlayers(true)}
                  className="btn-primary hover-shadow-glow"
                >
                  Load More Players
                </button>
              </div>
            )}

            {!isLoading && players.length === 0 && !error && (
              <div className="text-center py-16">
                <div className="bg-gray-800/50 rounded-xl p-8 max-w-lg mx-auto">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-400 text-xl mb-2">No players found</p>
                  <p className="text-gray-500">Try adjusting your search criteria or selecting a different team</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </Layout>
  );
}