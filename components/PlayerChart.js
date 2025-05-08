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

export default function PlayerChart({ data }) {
  const chartData = {
    labels: data.map(d => d.season),
    datasets: [
      {
        label: 'PER',
        data: data.map(d => d.per),
        fill: false,
        borderColor: 'rgb(139, 92, 246)',
        tension: 0.3,
      },
    ],
  };

  return <Line data={chartData} />;
}

