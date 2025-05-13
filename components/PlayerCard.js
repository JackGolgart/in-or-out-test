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
    <div className="group relative">
      <div className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-800/70 hover:border-purple-500/30">
        {/* Quick actions */}
        {user && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickPick('in');
              }}
              disabled={quickPickLoading || currentPick === 'in'}
              className={`p-1.5 rounded-full transition-colors duration-200 ${
                currentPick === 'in'
                  ? 'bg-green-600/90 cursor-default'
                  : quickPickLoading
                  ? 'bg-gray-600/50 cursor-not-allowed'
                  : 'bg-green-600/70 hover:bg-green-600'
              }`}
              title={
                currentPick === 'in' 
                  ? 'Already picked IN' 
                  : quickPickLoading 
                  ? 'Processing...' 
                  : 'Quick Pick: IN'
              }
            >
              <span className="sr-only">Pick IN</span>
              {quickPickLoading ? (
                <LoadingSpinner size="sm" light />
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickPick('out');
              }}
              disabled={quickPickLoading || currentPick === 'out'}
              className={`p-1.5 rounded-full transition-colors duration-200 ${
                currentPick === 'out'
                  ? 'bg-red-600/90 cursor-default'
                  : quickPickLoading
                  ? 'bg-gray-600/50 cursor-not-allowed'
                  : 'bg-red-600/70 hover:bg-red-600'
              }`}
              title={
                currentPick === 'out' 
                  ? 'Already picked OUT' 
                  : quickPickLoading 
                  ? 'Processing...' 
                  : 'Quick Pick: OUT'
              }
            >
              <span className="sr-only">Pick OUT</span>
              {quickPickLoading ? (
                <LoadingSpinner size="sm" light />
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center space-x-4" onClick={() => router.push(`/player/${player.id}`)}>
          <div className="flex-shrink-0">
            <JerseyAvatar
              teamAbbr={player.team.abbreviation}
              firstName={player.first_name}
              lastName={player.last_name}
              size="sm"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate group-hover:text-purple-400 transition-colors duration-300">
              {player.first_name} {player.last_name}
            </h3>
            <p className="text-gray-400 text-sm truncate">{player.team.full_name}</p>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-400 text-xs uppercase tracking-wider">NET</span>
            <span className={`text-base font-semibold ${
              player.net_rating > 0 ? 'text-green-400' : 
              player.net_rating < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {typeof player.net_rating === 'number' ? player.net_rating.toFixed(1) : 'N/A'}
            </span>
          </div>
          <button
            onClick={() => router.push(`/player/${player.id}`)}
            className="px-4 py-1.5 text-sm bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors duration-300"
          >
            View Stats
          </button>
        </div>
      </div>
    </div>
  );
}