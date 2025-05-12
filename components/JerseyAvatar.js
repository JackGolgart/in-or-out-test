import React from 'react';
import TEAM_COLORS from '../lib/teamColors';
import getTeamLogo from '../lib/teamLogos';

const JerseyAvatar = ({ teamAbbr, firstName, lastName }) => {
  const getTeamColors = (abbr) => {
    const colors = {
      ATL: ['#E03A3E', '#C1D32F'],
      BOS: ['#007A33', '#BA9653'],
      BKN: ['#000000', '#FFFFFF'],
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
    return colors[abbr] || ['#666666', '#333333'];
  };

  const [primaryColor, secondaryColor] = getTeamColors(teamAbbr);
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const logoUrl = getTeamLogo(teamAbbr);

  return (
    <div
      className="group relative w-16 h-24 rounded-t-xl rounded-b-lg flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        border: `3px solid ${primaryColor}`,
      }}
    >
      <span className="transition-transform duration-300 group-hover:-translate-y-1">
        {initials}
      </span>
      <img
        src={logoUrl}
        alt={`${teamAbbr} logo`}
        className="absolute bottom-1 right-1 w-6 h-6 opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"
      />
      <div 
        className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"
        aria-hidden="true"
      />
    </div>
  );
};

export default JerseyAvatar;

