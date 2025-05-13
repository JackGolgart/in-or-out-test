import { getTeams } from '../../lib/bdlClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const teams = await getTeams();
    
    if (!teams || !Array.isArray(teams)) {
      console.error('Invalid teams response:', teams);
      return res.status(500).json({ error: 'Invalid API response format' });
    }
    
    // Sort teams alphabetically by full name
    const sortedTeams = teams.sort((a, b) => a.full_name.localeCompare(b.full_name));
    
    res.status(200).json(sortedTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
}

// Move team colors here as a helper function
function getTeamColor(abbreviation) {
  const colors = {
    ATL: '#E03A3E',
    BOS: '#007A33',
    BKN: '#000000',
    CHA: '#1D1160',
    CHI: '#CE1141',
    CLE: '#6F263D',
    DAL: '#00538C',
    DEN: '#0E2240',
    DET: '#C8102E',
    GSW: '#1D428A',
    HOU: '#CE1141',
    IND: '#002D62',
    LAC: '#C8102E',
    LAL: '#552583',
    MEM: '#5D76A9',
    MIA: '#98002E',
    MIL: '#00471B',
    MIN: '#0C2340',
    NOP: '#0C2340',
    NYK: '#006BB6',
    OKC: '#007AC1',
    ORL: '#0077C0',
    PHI: '#006BB6',
    PHX: '#1D1160',
    POR: '#E03A3E',
    SAC: '#5A2D81',
    SAS: '#C4CED4',
    TOR: '#CE1141',
    UTA: '#002B5C',
    WAS: '#002B5C',
  };
  
  return colors[abbreviation] || '#2D3748'; // Default color if not found
} 