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
  Filler
} from 'chart.js';
import { trackComponentRender } from '../utils/performance';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function NetRatingTrendChart({ data, isLoading, error }) {
  const [renderStart] = useState(Date.now());
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    return () => {
      trackComponentRender('NetRatingTrendChart', Date.now() - renderStart);
    };
  }, [renderStart]);

  const chartData = useMemo(() => {
    if (!data || !data.length) return null;

    const netRatings = data.map(d => d.net_rating);
    const minRating = Math.min(...netRatings);
    const maxRating = Math.max(...netRatings);

    return {
      labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })),
      datasets: [
        {
          label: 'NET Rating',
          data: netRatings,
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: (ctx) => hoveredPoint === ctx.dataIndex ? 8 : 4,
          pointHoverRadius: 8,
          pointBackgroundColor: (ctx) => hoveredPoint === ctx.dataIndex ? 'white' : 'rgb(147, 51, 234)',
          pointBorderColor: 'rgb(147, 51, 234)',
          pointBorderWidth: 2,
          segment: {
            borderColor: (ctx) => {
              if (!ctx.p0.parsed || !ctx.p1.parsed) return 'rgb(147, 51, 234)';
              return ctx.p0.parsed.y > ctx.p1.parsed.y ? 
                'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)';
            }
          }
        },
        {
          label: 'Average',
          data: Array(data.length).fill(netRatings.reduce((a, b) => a + b, 0) / netRatings.length),
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
          fill: false
        }
      ]
    };
  }, [data, hoveredPoint]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    onHover: (event, elements) => {
      setHoveredPoint(elements.length ? elements[0].index : null);
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: 'rgb(147, 51, 234)',
        bodyColor: 'white',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (tooltipItems) => {
            const idx = tooltipItems[0].dataIndex;
            return new Date(data[idx].date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          },
          label: (context) => {
            const value = context.raw;
            return `NET Rating: ${value.toFixed(1)}`;
          }
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: (value) => value.toFixed(1)
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          }
        },
        border: {
          display: false
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto"></div>
            <div className="h-40 bg-gray-700/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-3">Failed to load chart data</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
            >
              Try refreshing
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-purple-500/10">
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
} 