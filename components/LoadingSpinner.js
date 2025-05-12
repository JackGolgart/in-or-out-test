'use client';

import React from 'react';

const LoadingSpinner = ({ size = 'md', light = false, message = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 
          ${light 
            ? 'border-white border-t-transparent' 
            : 'border-purple-600 border-t-transparent'
          }`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">{message}</span>
      </div>
      {message && (
        <p className={`text-sm ${light ? 'text-white' : 'text-gray-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 