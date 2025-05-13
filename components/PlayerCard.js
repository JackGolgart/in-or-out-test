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

export default function PlayerCard({ player, onClick }) {
  const [renderStart] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    return () => {
      trackComponentRender('PlayerCard', Date.now() - renderStart);
    };
  }, [renderStart]);

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('predictions')
          .select('prediction')
          .eq('player_id', player.id)
          .eq('user_id', user.id)
          .single();
        setPrediction(data?.prediction);
      } catch (error) {
        console.error('Error fetching prediction:', error);
      }
    };
    fetchPrediction();
  }, [player.id, user]);

  if (!player) return <LoadingSkeleton />;

  return (
    <div
      onClick={onClick}
      className="group bg-gray-800/50 hover:bg-gray-800/70 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/30 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer backdrop-blur-sm"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative flex-shrink-0">
          <JerseyAvatar
            teamAbbreviation={player.team?.abbreviation}
            className="w-12 h-12 rounded-full"
            onLoad={() => setIsLoading(false)}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-full">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate group-hover:text-purple-400 transition-colors duration-300">
            {player.first_name} {player.last_name}
          </h3>
          <p className="text-gray-400 text-sm truncate">
            {player.position} • {player.team?.abbreviation}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium px-2 py-1 rounded-md bg-gray-900/50 text-gray-300 border border-gray-700/30">
            {player.team?.conference}
          </span>
        </div>
        {user && (
          <div className="flex items-center space-x-2">
            {prediction ? (
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                prediction === 'IN' 
                  ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-900/20 text-red-400 border border-red-500/30'
              }`}>
                {prediction}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-900/50 text-gray-400 border border-gray-700/30">
                No Pick
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}