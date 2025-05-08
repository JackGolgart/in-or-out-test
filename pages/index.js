import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

export default function Home() {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [topIns24h, setTopIns24h] = useState([]);
  const [topOuts24h, setTopOuts24h] = useState([]);
  const [topIns7d, setTopIns7d] = useState([]);
  const [topOuts7d, setTopOuts7d] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch('https://www.balldontlie.io/api/v1/teams')
      .then(res => res.json())
      .then(data => setTeams(data.data))
      .catch(console.error);
  }, []);

  const fetchPlayers = () => {
    let url = 'https://www.balldontlie.io/api/v1/players?per_page=100';
    if (query.length > 2) url += `&search=${query}`;
    if (selectedTeam) url += `&team_ids[]=${selectedTeam}`;
    if (selectedPosition) url += `&positions[]=${selectedPosition}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setPlayers(data.data))
      .catch(() => setPlayers([]));
  };

  useEffect(() => {
    const delay = setTimeout(fetchPlayers, 400);
    return () => clearTimeout(delay);
  }, [query, selectedTeam, selectedPosition]);

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
      <div className="p-4 bg-gray-800 rounded text-center">
        <h3 className="text-white">{player.first_name} {player.last_name}</h3>
        <p className="text-gray-400 text-sm">{player.team.full_name}</p>
        <button
          onClick={() => router.push(`/player/${player.id}`)}
          className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          View Profile
        </button>
      </div>
    );
  };

  return (
    <Layout>
      <section className="text-center py-10 px-4">
        <h2 className="text-4xl font-extrabold mb-4">Pick Your Players</h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Search NBA players, filter by team or position, and track top picks!
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 flex flex-wrap gap-4 mb-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPlayers();
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
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.106a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
          </svg>
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
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="p-3 bg-gray-800 border border-purple-500 rounded text-white"
        >
          <option value="">All Positions</option>
          {['G', 'F', 'C'].map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>

      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {players.map(player => (
          <div key={player.id} className="p-4 bg-gray-800 rounded shadow">
            <h3 className="text-white">{player.first_name} {player.last_name}</h3>
            <p className="text-gray-400 text-sm">{player.team.full_name}</p>
            <p className="text-gray-400 text-sm">Position: {player.position || 'N/A'}</p>
            <button
              onClick={() => router.push(`/player/${player.id}`)}
              className="mt-2 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
            >
              View Profile
            </button>
          </div>
        ))}
      </div>

      <section className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        {[
          ['Top IN - 24H', topIns24h],
          ['Top OUT - 24H', topOuts24h],
          ['Top IN - 7D', topIns7d],
          ['Top OUT - 7D', topOuts7d],
        ].map(([title, picks]) => (
          <div key={title}>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <Swiper spaceBetween={10} slidesPerView={3}>
              {picks.map(p => (
                <SwiperSlide key={p.player_id}>{renderPlayerCard(p.player_id)}</SwiperSlide>
              ))}
            </Swiper>
          </div>
        ))}
      </section>
    </Layout>
  );
}

