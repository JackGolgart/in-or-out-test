import React from 'react';
import TEAM_COLORS from '../lib/teamColors';
import getTeamLogo from '../lib/teamLogos';

export default function JerseyAvatar({ teamAbbr, firstName, lastName }) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const colors = {
    ATL: ['#E03A3E', '#C1D32F'],
    BKN: ['#000000', '#FFFFFF'],
    BOS: ['#007A33', '#BA9653'],
    CHA: ['#1D1160', '#00788C'],
    CHI: ['#CE1141', '#000000'],
    CLE: ['#860038', '#041E42'],
    DAL: ['#00538C', '#002B5E'],
    DEN: ['#0E2240', '#FEC524'],
    DET: ['#C8102E', '#1D42BA'],
    GSW: ['#1D428A', '#FFC72C'],
    HOU: ['#CE1141', '#000000'],
    IND: ['#002D62', '#FDBB30'],
    LAC: ['#C8102E', '#1D428A'],
    LAL: ['#552583', '#FDB927'],
    MEM: ['#5D76A9', '#12173F'],
    MIA: ['#98002E', '#F9A01B'],
    MIL: ['#00471B', '#EEE1C6'],
    MIN: ['#0C2340', '#236192'],
    NOP: ['#0C2340', '#C8102E'],
    NYK: ['#006BB6', '#F58426'],
    OKC: ['#007AC1', '#EF3B24'],
    ORL: ['#0077C0', '#C4CED4'],
    PHI: ['#006BB6', '#ED174C'],
    PHX: ['#1D1160', '#E56020'],
    POR: ['#E03A3E', '#000000'],
    SAC: ['#5A2D81', '#63727A'],
    SAS: ['#C4CED4', '#000000'],
    TOR: ['#CE1141', '#000000'],
    UTA: ['#002B5C', '#00471B'],
    WAS: ['#002B5C', '#E31837']
  };

  const [primary, secondary] = colors[teamAbbr] || ['#718096', '#4A5568'];

  return (
    <div 
      className="relative w-20 h-20 transform transition-transform hover:scale-110"
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        borderRadius: '50%',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div 
        className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl"
        style={{
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
        }}
      >
        {initials}
      </div>
      <div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-t-lg"
        style={{
          minWidth: '40px',
          textAlign: 'center',
        }}
      >
        {teamAbbr || 'NBA'}
      </div>
    </div>
  );
}

