import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import api from '../lib/bdlClient';
import Layout from '../components/Layout';

export default function HomePage() {
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const delay = setTimeout(() => fetchPlayers(false), 400);
    return () => clearTimeout(delay);
  }, [query, selectedTeam]);

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
        <p className="text-purple-300 text-sm mt-1">NET Rating: {player.net_rating}</p>
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
      <section className="text-center py-10 px-4">
        <h2 className="text-4xl font-extrabold mb-4">Pick Your Players</h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Search NBA players, filter by team, and track top picks!
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 flex flex-wrap gap-4 mb-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPlayers(false);
          }}
          className="relative flex-1"
        >
          <input
            type="text"
            className="w-full px-4 py-2 rounded-md border border-gray-600 bg-gray-900 text-white"
            placeholder="Search players..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white px-4 py-2 rounded-md"
          >
            Search
          </button>
        </form>
      </div>

      <div className="max-w-5xl mx-auto px-4 flex flex-wrap gap-4">
        {players.map(renderPlayerCard)}
      </div>

      {isLoading && <p className="text-center text-white mt-4">Loading...</p>}
    </Layout>
  );
}