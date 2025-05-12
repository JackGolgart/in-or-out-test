'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import JerseyAvatar from './JerseyAvatar';
import PlayerStats from './PlayerStats';
import { trackComponentRender } from '../utils/performance';

export default function PlayerCard({ player, isLoading }) {
  const router = useRouter();
  const [renderStart] = useState(Date.now());

  useEffect(() => {
    return () => {
      trackComponentRender('PlayerCard', Date.now() - renderStart);
    };
  }, [renderStart]);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 animate-pulse">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!player) return null;

  return (
    <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden">
      <div className="absolute top-0 right-0 text-[120px] font-bold text-gray-700/20 leading-none select-none">
        {player.number || '00'}
      </div>
      
      <div className="relative p-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <JerseyAvatar
              teamAbbr={player.team.abbreviation}
              firstName={player.first_name}
              lastName={player.last_name}
              size="lg"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors duration-300">
                {player.first_name} {player.last_name}
              </h3>
              <span className="px-2 py-1 text-xs font-semibold bg-gray-700 text-gray-300 rounded-full">
                #{player.number || '00'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-gray-400 text-sm">{player.team.full_name}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 text-sm">{player.position || 'N/A'}</span>
            </div>

            <PlayerStats stats={{
              net_rating: player.net_rating,
              ppg: player.ppg,
              games_played: player.games_played
            }} />

            <button
              onClick={() => router.push(`/player/${player.id}`)}
              className="mt-6 w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transform transition-all duration-300 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              View Full Profile
            </button>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}