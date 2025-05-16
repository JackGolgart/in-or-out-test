import { useState, useEffect } from 'react';

export default function BadgeNotification({ badge, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg border border-purple-500/50 shadow-lg max-w-sm">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <img 
              src={badge.icon} 
              alt={badge.name} 
              className="w-12 h-12 rounded-lg bg-gray-700/50 p-2"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-purple-300 text-lg">New Badge Earned!</h3>
            <p className="text-white font-semibold mt-1">{badge.name}</p>
            <p className="text-sm text-gray-400 mt-1">{badge.description}</p>
          </div>
          <button 
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 