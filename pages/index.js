import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { supabase } from '../lib/supabase';
import api from '../lib/bdlClient';
import Layout from '../components/Layout';
import JerseyAvatar from '../components/JerseyAvatar';

export default function Home() {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [topIns24h, setTopIns24h] = useState([]);
  const [topOuts24h, setTopOuts24h] = useState([]);
  const [topIns7d, setTopIns7d] = useState([]);
  const [topOuts7d, setTopOuts7d] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingView, setTrendingView] = useState('ins24h');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

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
    const averagesRes = await api.nba.getSeasonAverages({ player_ids: ids, season: 2023 });
    const averagesMap = new Map(averagesRes.data.map(a => [a.player_id, a]));

    const playerStats = newPlayers.map(player => {
      const avg = averagesMap.get(player.id);
      let per = null;

      if (avg) {
        per = (
          avg.pts + avg.reb + avg.ast + avg.stl + avg.blk -
          (avg.fga - avg.fgm) -
          (avg.fta - avg.ftm) -
          avg.turnover
        ).toFixed(2);
      }

      return { ...player, per };
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


  useEffect(() => {
    const delay = setTimeout(() => fetchPlayers(false), 400);
    return () => clearTimeout(delay);
  }, [query, selectedTeam]);

  useEffect(() => {
    const fetchTopPicks = async (selection, timeframe, setter) => {
      const { data } = await supabase
        .from('picks')
        .select('player_id, count:player_id')
        .eq('selection', selection)
        .gte('created_at', timeframe)
        .group('player_id')
        .order('count', { ascending: false })
        .limit(10);
      if (data) setter(data);
    };

    const now = new Date();
    const past24h = new Date(now - 864e5).toISOString();
    const past7d = new Date(now - 7 * 864e5).toISOString();

    fetchTopPicks('in', past24h, setTopIns24h);
    fetchTopPicks('out', past24h, setTopOuts24h);
    fetchTopPicks('in', past7d, setTopIns7d);
    fetchTopPicks('out', past7d, setTopOuts7d);
  }, []);

  const renderPlayerCard = (playerId) => {
    const player = players.find(p => p.id === playerId);
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
        <p className="text-purple-300 text-sm mt-1">PER: {player.per ?? 'N/A'}</p>
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
          type="search"
          placeholder="Search players by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-3 pl-10 rounded bg-gray-800 border border-purple-500 text-white"
        />
      </form>

      <select
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
        className="p-3 bg-gray-800 border border-purple-500 rounded text-white"
      >
        <option value="">All Teams</option>
        {teams.map(team => (
          <option key={team.id} value={team.id}>{team.full_name}</option>
        ))}
      </select>
    </div>

    <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {isLoading && players.length === 0 ? (
        <p className="text-purple-400 col-span-full text-center animate-pulse">Loading players...</p>
      ) : players.length > 0 ? (
        players.map(player => renderPlayerCard(player.id))
      ) : (
        <p className="text-gray-400 col-span-full text-center">No players found.</p>
      )}
    </div>

    {hasMore && !isLoading && (
      <div className="text-center mt-6">
        <button
          onClick={() => fetchPlayers(true)}
          className="px-6 py-2 bg-purple-700 text-white rounded hover:bg-purple-800"
        >
          Load More Players
        </button>
      </div>
    )}

    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Trending Players</h2>
        <div className="space-x-2">
          {['ins24h', 'outs24h', 'ins7d', 'outs7d'].map(view => (
            <button
              key={view}
              onClick={() => setTrendingView(view)}
              className={`px-4 py-2 rounded ${trendingView === view ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              {view.replace(/(ins|outs)/, m => m.toUpperCase()).replace('24h', ' - 24H').replace('7d', ' - 7D')}
            </button>
          ))}
        </div>
      </div>

      <Swiper spaceBetween={10} slidesPerView={3}>
        {(trendingView === 'ins24h' ? topIns24h :
          trendingView === 'outs24h' ? topOuts24h :
          trendingView === 'ins7d' ? topIns7d :
          topOuts7d
        ).map(p => (
          <SwiperSlide key={p.player_id}>{renderPlayerCard(p.player_id)}</SwiperSlide>
        ))}
      </Swiper>
    </section>
  </Layout>
);
}
