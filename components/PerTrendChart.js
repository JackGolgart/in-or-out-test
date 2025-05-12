import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const getColor = (index) => {
  const colors = [
    { line: 'rgb(139, 92, 246)', fill: 'rgba(139, 92, 246, 0.1)' },    // Purple
    { line: 'rgb(34, 197, 94)', fill: 'rgba(34, 197, 94, 0.1)' },      // Green
    { line: 'rgb(244, 63, 94)', fill: 'rgba(244, 63, 94, 0.1)' },      // Red
    { line: 'rgb(59, 130, 246)', fill: 'rgba(59, 130, 246, 0.1)' },    // Blue
    { line: 'rgb(234, 179, 8)', fill: 'rgba(234, 179, 8, 0.1)' },      // Yellow
    { line: 'rgb(236, 72, 153)', fill: 'rgba(236, 72, 153, 0.1)' },    // Pink
  ];
  return colors[index % colors.length];
};

export default function NetRatingTrendChart({ data }) {
  const players = [...new Set(data.map(d => d.label))];

  const datasets = players.map((player, i) => {
    const color = getColor(i);
    return {
      label: player,
      data: data
        .filter(d => d.label === player)
        .map(d => ({ x: d.date, y: d.net_rating })),
      borderColor: color.line,
      backgroundColor: color.fill,
      tension: 0.3,
      fill: true,
      borderWidth: 2,
      pointBackgroundColor: color.line,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: color.line,
      pointRadius: 4,
      pointHoverRadius: 6,
    };
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            family: 'system-ui',
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: context => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`,
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
        title: {
          display: true,
          text: 'Date',
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 14,
            weight: 'normal',
          },
          padding: { top: 10 }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
        title: {
          display: true,
          text: 'NET Rating',
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 14,
            weight: 'normal',
          },
          padding: { bottom: 10 }
        }
      },
    },
  };

  return (
    <div className="w-full h-96 p-6 bg-gray-800 rounded-xl shadow-lg">
      <Line data={{ datasets }} options={options} />
    </div>
  );
}


