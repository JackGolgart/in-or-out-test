'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import JerseyAvatar from './JerseyAvatar';
import { trackComponentRender } from '../utils/performance';
import LoadingSpinner from './LoadingSpinner';

const LoadingSkeleton = () => (
  <div className="bg-gray-800/50 rounded-xl p-4 shadow-lg border border-gray-700/50">
    <div className="animate-pulse space-y-3">
      <div className="flex items-center space-x-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 bg-gray-700 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-shimmer" 
                 style={{ transform: 'translateX(-100%)' }}></div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-700 rounded w-16"></div>
        <div className="h-8 bg-gray-700 rounded-lg w-24"></div>
      </div>
    </div>
  </div>
);

export default function PlayerCard({ player, isLoading }) {
  const router = useRouter();
  const { user } = useAuth();
  const [renderStart] = useState(Date.now());
  const [quickPickLoading, setQuickPickLoading] = useState(false);
  const [currentPick, setCurrentPick] = useState(null);

  useEffect(() => {
    return () => {
      trackComponentRender('PlayerCard', Date.now() - renderStart);
    };
  }, [renderStart]);

  useEffect(() => {
    const fetchCurrentPick = async () => {
      if (!user || !player) return;
      
      const { data } = await supabase
        .from('picks')
        .select('selection')
        .eq('user_id', user.id)
        .eq('player_id', player.id)
        .maybeSingle();

      if (data) {
        setCurrentPick(data.selection);
      }
    };

    fetchCurrentPick();
  }, [user, player]);

  const handleQuickPick = async (selection) => {
    if (!user || quickPickLoading) return;

    try {
      setQuickPickLoading(true);
      const { error } = await supabase.from('picks').upsert({
        user_id: user.id,
        player_id: player.id,
        player_name: `${player.first_name} ${player.last_name}`,
        selection,
        initial_net_rating: player.net_rating,
      });

      if (!error) {
        setCurrentPick(selection);
      }
    } catch (error) {
      console.error('Error making quick pick:', error);
    } finally {
      setQuickPickLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!player) return null;

  return (
    <div className="p-4 bg-gray-800 rounded text-center shadow-md flex flex-col items-center transform transition-transform hover:scale-105">
      <div className="mb-2">
        <JerseyAvatar
          teamAbbr={player.team?.abbreviation}
          firstName={player.first_name}
          lastName={player.last_name}
        />
      </div>
      <h3 className="text-white text-lg">{player.first_name} {player.last_name}</h3>
      <p className="text-gray-400 text-xs">{player.team?.full_name}</p>
      <p className="text-purple-300 text-sm mt-1">PER: {player.per ?? 'N/A'}</p>
      <p className="text-gray-400 text-xs">Position: {player.position || 'N/A'}</p>
      <button
        onClick={() => router.push(`/player/${player.id}`)}
        className="mt-2 px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
      >
        View Details
      </button>
    </div>
  );
}