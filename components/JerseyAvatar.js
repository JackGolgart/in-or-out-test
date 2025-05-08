import TEAM_COLORS from '../lib/teamColors';
import getTeamLogo from '../lib/teamLogos';

export default function JerseyAvatar({ teamAbbr, firstName, lastName }) {
  const teamColor = TEAM_COLORS[teamAbbr] || '#1E3A8A';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  const logoUrl = getTeamLogo(teamAbbr);

  return (
    <div
      className="relative w-16 h-24 rounded-t-md rounded-b-sm flex items-center justify-center text-white font-bold text-xl shadow-md uppercase overflow-hidden transform transition-transform hover:scale-105"
      style={{
        backgroundColor: teamColor,
        border: `3px solid ${teamColor}`,
      }}
    >
      {initials}
      <img
        src={logoUrl}
        alt={`${teamAbbr} logo`}
        className="absolute bottom-1 right-1 w-6 h-6 opacity-80 hover:opacity-100 transition-opacity"
      />
    </div>
  );
}

