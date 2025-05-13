'use client';

import React from 'react';

const StatBadge = ({ label, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-900/20 border-blue-500/30',
    red: 'bg-red-900/20 border-red-500/30',
    green: 'bg-green-900/20 border-green-500/30'
  };

  return (
    <div className={`card-interactive ${colorClasses[color]} group`}>
      <div className="px-6 py-4">
        <div className="text-3xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">{value}</div>
        <div className="text-sm text-gray-400 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
};

const PlayerStats = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-base animate-pulse">
            <div className="h-24 flex flex-col justify-center">
              <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card-base text-center py-8">
        <p className="text-gray-400">No stats available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatBadge
        label="Points"
        value={stats.pts?.toFixed(1) || 'N/A'}
        color="blue"
      />
      <StatBadge
        label="Rebounds"
        value={stats.reb?.toFixed(1) || 'N/A'}
        color="green"
      />
      <StatBadge
        label="Assists"
        value={stats.ast?.toFixed(1) || 'N/A'}
        color="blue"
      />
      <StatBadge
        label="Net Rating"
        value={stats.net_rating?.toFixed(1) || 'N/A'}
        color={stats.net_rating > 0 ? 'green' : 'red'}
      />
    </div>
  );
};

export default PlayerStats; 