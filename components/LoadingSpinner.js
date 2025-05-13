'use client';

import React from 'react';

const LoadingSpinner = ({ size = 'md', message }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin`}></div>
      </div>
      {message && (
        <p className="text-gray-500 text-sm">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner; 