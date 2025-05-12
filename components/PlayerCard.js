'use client';

import { useEffect, useState } from 'react';
import JerseyAvatar from './JerseyAvatar';
import LoadingSpinner from './LoadingSpinner';
import { trackComponentRender } from '../utils/performance';

export default function PlayerCard({ player, isLoading }) {
  const [renderStart] = useState(Date.now());

  useEffect(() => {
    return () => {
      trackComponentRender('PlayerCard', Date.now() - renderStart);
    };
  }, [renderStart]);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            <div className="flex space-x-4">
              <div className="h-3 bg-gray-700 rounded w-16"></div>
              <div className="h-3 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="bg-red-900/20 rounded-xl p-4 shadow-lg border border-red-700">
        <p className="text-red-400 text-center">Error loading player data</p>
      </div>
    );
  }

  return (
    <div className="group bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-750 border border-gray-700">
      <div className="flex items-center space-x-4">
        <JerseyAvatar 
          teamAbbr={player.team} 
          firstName={player.firstName} 
          lastName={player.lastName} 
        />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors duration-300">
            {player.firstName} {player.lastName}
          </h2>
          <p className="text-gray-400 text-sm">
            {player.team} • #{player.number || 'N/A'}
          </p>
          <div className="mt-2 flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-400">NET</span>
              <span className={`ml-2 text-white font-medium ${
                player.net_rating > 0 ? 'text-green-400' : player.net_rating < 0 ? 'text-red-400' : ''
              }`}>
                {player.net_rating?.toFixed(1) || 'N/A'}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">PPG</span>
              <span className="ml-2 text-white font-medium">{player.ppg?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}