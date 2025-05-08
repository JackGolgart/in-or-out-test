import TEAM_COLORS from '../lib/teamColors';

export default function JerseyAvatar({ teamAbbr, firstName, lastName }) {
  const teamColor = TEAM_COLORS[teamAbbr] || '#1E3A8A';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;

  return (
    <div
      className="w-16 h-24 rounded-sm flex items-center justify-center text-white font-bold text-xl shadow-md uppercase"
      style={{
        background: `linear-gradient(90deg, white 35%, ${teamColor} 65%)`,
        border: `3px solid ${teamColor}`
      }}
    >
      {initials}
    </div>
  );
}
