import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('https://www.balldontlie.io/api/v1/players?per_page=50')
      .then(res => res.json())
      .then(data => setPlayers(data.data));
  }, []);

  const filtered = players.filter(p =>
    (p.first_name + ' ' + p.last_name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#101010', color: 'white', padding: '20px' }}>
      <h1 style={{ fontSize: '2rem', color: '#fff' }}>In or Out?</h1>
      <input
        type="text"
        placeholder="Search player..."
        onChange={e => setSearch(e.target.value)}
        style={{ padding: '8px', width: '300px', marginBottom: '20px' }}
      />
      <ul>
        {filtered.map(player => (
          <li key={player.id} style={{ marginBottom: '10px' }}>
            <span style={{ marginRight: '10px', backgroundColor: '#222', padding: '4px 8px' }}>
              #{player.id}
            </span>
            {player.first_name} {player.last_name}
            <button style={{ marginLeft: '10px' }}>IN</button>
            <button style={{ marginLeft: '5px' }}>OUT</button>
          </li>
        ))}
      </ul>
      <Link href="/portfolio">Go to Portfolio</Link>
    </div>
  );
}