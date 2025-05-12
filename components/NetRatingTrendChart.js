'use client';

import { useEffect, useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { trackComponentRender } from '../utils/performance';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function NetRatingTrendChart({ data, isLoading, error }) {
  const [renderStart] = useState(Date.now());

  useEffect(() => {
    return () => {
      trackComponentRender('NetRatingTrendChart', Date.now() - renderStart);
    };
  }, [renderStart]);

  const chartData = useMemo(() => {
    if (!data || !data.length) return null;

    return {
      labels: data.map(d => d.date),
      datasets: [{
        label: 'NET Rating',
        data: data.map(d => d.net_rating),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgb(147, 51, 234)',
        bodyColor: 'white',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1,
        padding: 10,
        displayColors: false
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 bg-gray-800 rounded-xl p-4 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto"></div>
          <div className="h-40 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 bg-red-900/20 rounded-xl p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load chart data</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-red-400 hover:text-red-300 underline"
          >
            Try refreshing
          </button>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="h-64 bg-gray-800 rounded-xl p-4 flex items-center justify-center">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-64 bg-gray-800 rounded-xl p-4">
      <Line data={chartData} options={options} />
    </div>
  );
} 