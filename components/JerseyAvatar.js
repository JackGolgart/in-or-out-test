import TEAM_COLORS from '../lib/teamColors';
import getTeamLogo from '../lib/teamLogos';

export default function JerseyAvatar({ teamAbbr, firstName, lastName }) {
  const teamColor = TEAM_COLORS[teamAbbr] || '#1E3A8A';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  const logoUrl = getTeamLogo(teamAbbr);

  return (
    <div
      className="group relative w-16 h-24 rounded-t-xl rounded-b-lg flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
      style={{
        backgroundColor: teamColor,
        border: `3px solid ${teamColor}`,
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
}

