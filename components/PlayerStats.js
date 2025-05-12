'use client';

import React from 'react';

const StatBadge = ({ label, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-900 border-blue-500',
    red: 'bg-red-900 border-red-500',
    green: 'bg-green-900 border-green-500'
  };

  return (
    <div className={`relative group overflow-hidden rounded-xl border ${colorClasses[color]} transition-all duration-300 hover:scale-105`}>
      <div className="px-6 py-4 backdrop-blur-sm bg-opacity-20">
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-gray-300 uppercase tracking-wider">{label}</div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
};

const PlayerStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatBadge 
        label="NET Rating" 
        value={stats.net_rating?.toFixed(1) || 'N/A'} 
        color={stats.net_rating > 0 ? 'green' : stats.net_rating < 0 ? 'red' : 'blue'}
      />
      <StatBadge 
        label="PPG" 
        value={stats.ppg?.toFixed(1) || 'N/A'} 
        color="blue"
      />
      <StatBadge 
        label="Games" 
        value={stats.games_played || 'N/A'} 
        color="blue"
      />
    </div>
  );
};

export default PlayerStats; 