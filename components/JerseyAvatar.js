import React from 'react';
import TEAM_COLORS from '../lib/teamColors';
import getTeamLogo from '../lib/teamLogos';

const JerseyAvatar = ({ teamAbbr, firstName, lastName, className = '' }) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const teamColor = getTeamColor(teamAbbr);

  return (
    <div 
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${teamColor} 0%, rgba(0,0,0,0.5) 100%)`
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative w-full h-full flex items-center justify-center">
        <span className="text-white text-sm font-medium">
          {initials}
        </span>
      </div>
    </div>
  );
};

const getTeamColor = (abbr) => {
  const colors = {
    LAL: '#552583',
    BOS: '#007A33',
    GSW: '#1D428A',
    // Add more team colors as needed
    DEFAULT: '#2D3748'
  };
  return colors[abbr] || colors.DEFAULT;
};

export default JerseyAvatar;

