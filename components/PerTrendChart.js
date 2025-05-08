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
    'rgb(139, 92, 246)',
    'rgb(34, 197, 94)',
    'rgb(244, 63, 94)',
    'rgb(59, 130, 246)',
    'rgb(234, 179, 8)',
    'rgb(236, 72, 153)',
  ];
  return colors[index % colors.length];
};

export default function PerTrendChart({ data }) {
  const players = [...new Set(data.map(d => d.label))];

  const datasets = players.map((player, i) => ({
    label: player,
    data: data
      .filter(d => d.label === player)
      .map(d => ({ x: d.date, y: d.per })),
    borderColor: getColor(i),
    backgroundColor: getColor(i),
    tension: 0.3,
    fill: false,
    pointRadius: 5,
    pointHoverRadius: 7,
  }));

  return (
    <Line
      data={{
        datasets
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: context => `${context.dataset.label}: ${context.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            type: 'category',
            title: {
              display: true,
              text: 'Date',
              color: '#ccc'
            },
            ticks: {
              color: '#aaa'
            }
          },
          y: {
            title: {
              display: true,
              text: 'PER',
              color: '#ccc'
            },
            ticks: {
              color: '#aaa'
            }
          },
        },
      }}
    />
  );
}


