'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import JerseyAvatar from './JerseyAvatar';
import { trackComponentRender } from '../utils/performance';
import LoadingSpinner from './LoadingSpinner';

const LoadingSkeleton = () => (
  <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
    <div className="animate-pulse space-y-4">
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 bg-gray-700 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-shimmer" 
               style={{ transform: 'translateX(-100%)' }}></div>
        </div>
      </div>
      <div className="space-y-3 text-center">
        <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
        <div className="flex items-center justify-center space-x-2 mt-4">
          <div className="h-4 bg-gray-700 rounded w-8"></div>
          <div className="h-4 bg-gray-700 rounded w-12"></div>
        </div>
        <div className="h-10 bg-gray-700 rounded-xl mt-4"></div>
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
    <div className="group relative card-hover">
      <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-750">
        {/* Quick actions */}
        {user && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickPick('in');
              }}
              disabled={quickPickLoading || currentPick === 'in'}
              className={`p-2 rounded-full transition-colors duration-200 ${
                currentPick === 'in'
                  ? 'bg-green-600 cursor-default'
                  : quickPickLoading
                  ? 'bg-gray-600 cursor-not-allowed'
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickPick('out');
              }}
              disabled={quickPickLoading || currentPick === 'out'}
              className={`p-2 rounded-full transition-colors duration-200 ${
                currentPick === 'out'
                  ? 'bg-red-600 cursor-default'
                  : quickPickLoading
                  ? 'bg-gray-600 cursor-not-allowed'
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        )}

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
            className="mt-4 w-full btn-primary"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}