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
      setPlayers(JSON.parse(cached));
    }
  }, []);

  useEffect(() => {
    fetch('https://www.balldontlie.io/api/v1/teams')
      .then(res => res.json())
      .then(data => setTeams(data.data))
      .catch(console.error);
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
      const newPlayers = response.data || [];

      const playerStats = await Promise.all(
        newPlayers.map(async (player) => {
          const cacheKey = `per:${player.id}`;
          const cachedEntry = localStorage.getItem(cacheKey);

          if (cachedEntry) {
            try {
              const { value, time } = JSON.parse(cachedEntry);
              if (Date.now() - time < 86400000) {
                return { ...player, per: value };
              } else {
                localStorage.removeItem(cacheKey);
              }
            } catch {
              localStorage.removeItem(cacheKey);
            }
          }

          let per = null;
          try {
            const statsRes = await fetch(
              `https://api.balldontlie.io/v1/stats?player_ids[]=${player.id}&seasons[]=2023&per_page=100`,
              {
                headers: {
                  Authorization: 'Bearer c81d57c3-85f8-40f2-ad5b-0c268c0220a0',
                },
              }
            );
            const statsJson = await statsRes.json();
            const games = statsJson.data;

            const totals = {
              pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
              fgm: 0, fga: 0, ftm: 0, fta: 0, tov: 0,
              min: 0, games: games.length,
            };

            games.forEach((g) => {
              totals.pts += g.pts;
              totals.reb += g.reb;
              totals.ast += g.ast;
              totals.stl += g.stl;
              totals.blk += g.blk;
              totals.fgm += g.fgm;
              totals.fga += g.fga;
              totals.ftm += g.ftm;
              totals.fta += g.fta;
              totals.tov += g.turnover;
              if (typeof g.min === 'string') {
                const minPart = parseInt(g.min.split(':')[0], 10);
                totals.min += isNaN(minPart) ? 0 : minPart;
              }
            });

            if (totals.min > 0) {
              per = (
                (totals.pts + totals.reb + totals.ast + totals.stl + totals.blk -
                  (totals.fga - totals.fgm) -
                  (totals.fta - totals.ftm) -
                  totals.tov) /
                totals.min
              ).toFixed(2);
            }
          } catch (err) {
            console.warn(`Failed PER fetch for player ${player.id}`);
          }

          if (per !== null) {
            localStorage.setItem(cacheKey, JSON.stringify({ value: per, time: Date.now() }));
          }

          return { ...player, per };
        })
      );

      const combined = isLoadMore ? [...players, ...playerStats] : playerStats;
      setPlayers(combined);
      localStorage.setItem('cached_players', JSON.stringify(combined));
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
      {/* Your existing header, search, filters, grid, and trending sections remain unchanged here. */}
    </Layout>
  );
}


