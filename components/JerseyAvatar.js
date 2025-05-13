import React, { useEffect, useState } from 'react';
import getTeamLogo from '../lib/teamLogos';

const JerseyAvatar = ({ teamAbbr, firstName, lastName, className = '', size = 'md', onLoad }) => {
  const [teamColor, setTeamColor] = useState('#2D3748');
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  
  useEffect(() => {
    const fetchTeamColor = async () => {
      try {
        const response = await fetch('/api/teams');
        const teams = await response.json();
        const team = teams.find(t => t.abbreviation === teamAbbr);
        if (team?.primary_color) {
          setTeamColor(team.primary_color);
        }
      } catch (error) {
        console.error('Error fetching team color:', error);
      }
    };

    if (teamAbbr) {
      fetchTeamColor();
    }
  }, [teamAbbr]);
  
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

