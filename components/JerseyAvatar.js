import React from 'react';
import getTeamLogo from '../lib/teamLogos';

const teamColors = {
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

const JerseyAvatar = ({ teamAbbr, firstName, lastName, className = '', size = 'md', onLoad }) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const teamColor = teamAbbr ? teamColors[teamAbbr] || '#2D3748' : '#2D3748';
  
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg'
  };

  return (
    <div 
      className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${teamColor} 0%, rgba(0,0,0,0.3) 100%)`
      }}
      onLoad={onLoad}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: teamAbbr ? `url(${getTeamLogo(teamAbbr)})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      <div className="relative w-full h-full flex items-center justify-center">
        <span className="text-white font-bold tracking-wider drop-shadow-lg">
          {initials}
        </span>
      </div>
    </div>
  );
};

export default JerseyAvatar;

