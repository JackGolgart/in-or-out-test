'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { trackComponentRender } from '../utils/performance';
import LoadingSpinner from './LoadingSpinner';
import JerseyAvatar from './JerseyAvatar';
import { getNetRatingColor } from '../utils/colors';

const LoadingSkeleton = () => (
  <div className="card-base">
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
  const router = useRouter();

  useEffect(() => {
    return () => {
      trackComponentRender('PlayerCard', Date.now() - renderStart);
    };
  }, [renderStart]);

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!user) {
        console.log('No user found, skipping prediction fetch');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/predictions', {
          headers: {
            'Authorization': `Bearer ${user.access_token}`
          }
        });

        if (response.status === 401) {
          console.log('User is not authenticated');
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch prediction');
        }

        const data = await response.json();
        const playerPrediction = data.find(p => p.player_id === player.id);
        setPrediction(playerPrediction);
      } catch (error) {
        console.error('Error fetching prediction:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrediction();
  }, [player.id, user]);

  const handlePick = async () => {
    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          player_id: player.id,
          prediction_type: 'in',
          net_rating: player.net_rating
        })
      });

      if (response.status === 401) {
        console.log('User is not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save prediction');
      }

      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Error saving prediction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!player) return <LoadingSkeleton />;

  return (
    <div className="card-interactive group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <JerseyAvatar
            teamAbbr={player.team.abbreviation}
            firstName={player.first_name}
            lastName={player.last_name}
            size="sm"
          />
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors duration-300">
              {player.first_name} {player.last_name}
            </h3>
            <p className="text-sm text-gray-400">
              {player.team.full_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">Net Rating</p>
            <p className={`text-lg font-semibold ${getNetRatingColor(player.net_rating)}`}>
              {player.net_rating ? player.net_rating.toFixed(1) : 'N/A'}
            </p>
          </div>
          <button
            onClick={handlePick}
            disabled={isLoading || !user}
            className={`btn-primary min-w-[100px] ${
              prediction ? 'bg-gray-600 hover:bg-gray-700' : ''
            }`}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : prediction ? (
              'Picked'
            ) : (
              'Pick'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}