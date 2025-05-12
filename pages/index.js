'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import api from '../lib/bdlClient';
import Layout from '../components/Layout';
import JerseyAvatar from '../components/JerseyAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import { trackComponentRender } from '../utils/performance';

const teams = [
  { id: 1, name: 'Atlanta Hawks', abbr: 'ATL' },
  { id: 2, name: 'Boston Celtics', abbr: 'BOS' },
  // Add all NBA teams here
];

export default function HomePage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [renderStart] = useState(Date.now());

  useEffect(() => {
    return () => {
      trackComponentRender('HomePage', Date.now() - renderStart);
    };
  }, [renderStart]);

  useEffect(() => {
    const delay = setTimeout(() => fetchPlayers(false), 400);
    return () => clearTimeout(delay);
  }, [query, selectedTeam]);

  const fetchPlayers = async (isLoadMore = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const options = {
        per_page: 12,
        page: isLoadMore ? page + 1 : 1,
      };
      if (query.length > 2) options.search = query;
      if (selectedTeam) options.team_ids = [parseInt(selectedTeam)];

      const response = await api.nba.getPlayers(options);
      const newPlayers = Array.isArray(response.data) ? response.data : [];

      // Fetch advanced stats for NET rating
      const ids = newPlayers.map(p => p.id);
      const advancedStatsRes = await fetch(`https://api.balldontlie.io/v1/stats/advanced?player_ids[]=${ids.join(',')}`);
      const advancedStats = await advancedStatsRes.json();

      const playersWithNetRating = newPlayers.map(player => {
        const stats = advancedStats.data.find(stat => stat.player.id === player.id);
        return {
          ...player,
          net_rating: stats?.net_rating ?? 'N/A',
        };
      });

      setPlayers(isLoadMore ? [...players, ...playersWithNetRating] : playersWithNetRating);
      setPage(isLoadMore ? page + 1 : 1);
    } catch (error) {
      console.error('Error fetching players:', error);
      setError('Failed to fetch players. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlayerCard = (player) => {
    if (!player) return null;
    return (
      <div key={player.id} className="group relative transform transition-all duration-300 hover:scale-105">
        <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-750">
          <div className="flex flex-col items-center">
            <div className="mb-4 transform transition-transform duration-300 group-hover:scale-110">
              <JerseyAvatar
                teamAbbr={player.team.abbreviation}
                firstName={player.first_name}
                lastName={player.last_name}
              />
            </div>
            <h3 className="text-white text-xl font-bold group-hover:text-purple-400 transition-colors duration-300">
              {player.first_name} {player.last_name}
            </h3>
            <p className="text-gray-400 text-sm mt-1">{player.team.full_name}</p>
            <div className="mt-3 flex items-center justify-center space-x-2">
              <span className="text-gray-400 text-sm">NET</span>
              <span className={`text-lg font-semibold ${
                player.net_rating > 0 ? 'text-green-400' : 
                player.net_rating < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {typeof player.net_rating === 'number' ? player.net_rating.toFixed(1) : 'N/A'}
              </span>
            </div>
            <button
              onClick={() => router.push(`/player/${player.id}`)}
              className="mt-4 w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transform transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-850 to-black">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-purple-900 py-16">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
            <div className="relative max-w-6xl mx-auto px-4">
              <h1 className="text-5xl font-extrabold mb-4 text-white">
                NBA Player Stats
              </h1>
              <p className="text-xl text-gray-200 max-w-2xl">
                Track performance, analyze statistics, and discover rising stars in the NBA.
              </p>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-gray-850 border-b border-gray-700 sticky top-0 z-10 backdrop-blur-sm bg-opacity-90">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    className="w-full px-6 py-3 rounded-xl border border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    placeholder="Search players by name..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="md:w-64">
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-6 py-3 rounded-xl border border-gray-600 bg-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="">All Teams</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="max-w-6xl mx-auto px-4 py-8">
            {error && (
              <div className="text-center mb-8">
                <p className="text-red-400 bg-red-900/20 rounded-xl px-6 py-4 inline-block">
                  {error}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {players.map(player => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {!isLoading && players.length > 0 && (
              <div className="text-center pb-8">
                <button
                  onClick={() => fetchPlayers(true)}
                  className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 hover:shadow-glow"
                >
                  Load More Players
                </button>
              </div>
            )}

            {!isLoading && players.length === 0 && !error && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-xl">No players found. Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </Layout>
  );
}