import React from 'react';
import TEAM_COLORS from '../lib/teamColors';
import getTeamLogo from '../lib/teamLogos';

const JerseyAvatar = ({ teamAbbr, firstName, lastName, className = '', size = 'md' }) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const teamColor = TEAM_COLORS[teamAbbr] || '#2D3748';
  
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
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${getTeamLogo(teamAbbr)})`,
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

